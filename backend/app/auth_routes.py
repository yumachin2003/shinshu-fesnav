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

    # ② ユーザー情報取得
    userinfo = requests.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
    ).json()

    email = userinfo["email"]
    name = userinfo.get("name")  # ← ★ 追加（Googleの表示名）

    # ③ ユーザー作成 or 取得
    userinfo = requests.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
    ).json()

    email = userinfo["email"]
    name = userinfo.get("name")  # ← Googleの表示名

    user = User.query.filter_by(username=email).first()
    if not user:
        user = User(
            username=email,
            display_name=name,
        )
        db.session.add(user)
    else:
        # 既存ユーザーでも更新しておく
        user.display_name = name
        db.session.commit()
