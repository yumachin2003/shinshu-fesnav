from flask import Blueprint, request, redirect, current_app
import requests
import jwt
import datetime
from .models import User
from . import db
from jwt import PyJWKClient
import json

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
    user = User.query.filter_by(email=email).first() or User.query.filter_by(username=email).first()
    if not user:
        user = User(
            username=email,
            email=email,
            display_name=name,
        )
        db.session.add(user)
    else:
        user.display_name = name
        user.email = email

    db.session.commit()

    # ④ JWT 発行
    token = jwt.encode(
        {
            "user_id": user.id,
            "email": user.email,
            "display_name": user.display_name,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7),
        },
        current_app.config["SECRET_KEY"],
        algorithm="HS256",
    )


    # ⑤ フロントへ token を渡す
    frontend_url = current_app.config["BASE_URL"]
    return redirect(f"{frontend_url}/login?token={token}")

@auth_bp.route("/line")
def line_login():
    line_auth_url = (
        "https://access.line.me/oauth2/v2.1/authorize"
        "?response_type=code"
        f"&client_id={current_app.config['LINE_CHANNEL_ID']}"
        f"&redirect_uri={current_app.config['LINE_REDIRECT_URI']}"
        "&state=LINE_LOGIN"
        "&scope=profile%20openid%20email"
    )
    return redirect(line_auth_url)

@auth_bp.route("/line/callback")
def line_callback():
    code = request.args.get("code")
    if not code:
        return "No code", 400

    # ① code → access_token
    token_res = requests.post(
        "https://api.line.me/oauth2/v2.1/token",
        data={
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": current_app.config["LINE_REDIRECT_URI"],
            "client_id": current_app.config["LINE_CHANNEL_ID"],
            "client_secret": current_app.config["LINE_CHANNEL_SECRET"],
        },
    ).json()

    access_token = token_res.get("access_token")
    id_token = token_res.get("id_token")
    if not access_token:
        return "LINE token exchange failed", 400

    # IDトークンからメールアドレスを取得
    email = None
    if id_token:
        try:
            # 署名検証は省略（LINEプラットフォームからの直接レスポンスのため）
            decoded_id_token = jwt.decode(id_token, options={"verify_signature": False})
            email = decoded_id_token.get("email")
        except Exception:
            pass

    # ② プロフィール取得
    profile = requests.get(
        "https://api.line.me/v2/profile",
        headers={"Authorization": f"Bearer {access_token}"},
    ).json()

    line_user_id = profile.get("userId")
    display_name = profile.get("displayName")

    if not line_user_id:
        return "Failed to get LINE user id", 400

    username = f"line:{line_user_id}"

    # ③ ユーザー作成 or 取得
    user = User.query.filter_by(line_user_id=line_user_id).first() or (User.query.filter_by(email=email).first() if email else None)
    if not user:
        user = User(
            username=username,
            line_user_id=line_user_id,
            display_name=display_name,
            email=email,
        )
        user.set_password("line-login")  # ← ★必須
        db.session.add(user)
    
    else:
        user.display_name = display_name
        if email: user.email = email

    db.session.commit()

    # ④ JWT 発行（Googleと同じ）
    token = jwt.encode(
        {
            "user_id": user.id,
            "email": user.email,
            "display_name": user.display_name,
            "login_type": "line",
            "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7),
        },
        current_app.config["SECRET_KEY"],
        algorithm="HS256",
    )

    frontend_url = current_app.config["BASE_URL"]
    return redirect(f"{frontend_url}/login?token={token}")