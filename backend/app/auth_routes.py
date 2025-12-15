from flask import Blueprint, request, redirect, current_app
import requests
import jwt
import datetime
from .models import User
from . import db

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/google/callback")
def google_callback():
    code = request.args.get("code")
    if not code:
        return "No code", 400

    # ① code → access_token
    token_res = requests.post(
        "https://oauth2.googleapis.com/token",
        data={
            "client_id": current_app.config["GOOGLE_CLIENT_ID"],
            "client_secret": current_app.config["GOOGLE_CLIENT_SECRET"],
            "code": code,
            "redirect_uri": current_app.config["GOOGLE_REDIRECT_URI"],
            "grant_type": "authorization_code",
        },
    ).json()

    access_token = token_res.get("access_token")
    if not access_token:
        return "Token exchange failed", 400

    # ② ユーザー情報取得（1回だけ）
    userinfo = requests.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
    ).json()

    email = userinfo.get("email")
    name = userinfo.get("name")  # ← Googleアカウント名

    if not email:
        return "Failed to get email", 400

    # ③ ユーザー作成 or 更新
    user = User.query.filter_by(username=email).first()
    if not user:
        user = User(username=email, password="google-login")
        user.display_name = name
        db.session.add(user)
    else:
        user.display_name = name  # ← 毎回同期（名前変更にも対応）

    db.session.commit()


    # ④ JWT 発行
    token = jwt.encode(
        {
            "user_id": user.id,
            "display_name": user.display_name,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7),
        },
        current_app.config["SECRET_KEY"],
        algorithm="HS256",
    )


    # ⑤ フロントへ token を渡す
    frontend_url = current_app.config["FRONTEND_URL"]
    return redirect(f"{frontend_url}/login?token={token}")
