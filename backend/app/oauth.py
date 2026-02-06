from flask import Blueprint, request, redirect, jsonify, current_app
import requests
import jwt
import datetime
from .models import User
from . import db
from urllib.parse import urlencode
import re

oauth_bp = Blueprint("oauth", __name__)

# --- Google ---

@oauth_bp.route("/google", methods=["GET"])
def google_login_url():
    
    client_id = current_app.config.get("GOOGLE_CLIENT_ID")
    redirect_uri = current_app.config.get("GOOGLE_REDIRECT_URI")

    print(f"DEBUG: client_id={client_id}, redirect_uri={redirect_uri}")

    scope = "openid email profile"
    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": scope,
        "access_type": "offline",
        "prompt": "consent",
    }
    google_auth_url = "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)
    return redirect(google_auth_url)

@oauth_bp.route("/google/callback", methods=["GET"])
def google_callback():
    code = request.args.get("code")
    base_url = current_app.config.get("BASE_URL").rstrip('/')
    frontend_url = f"{base_url}/login/callback?code={code}&provider=google"
    return redirect(frontend_url)

@oauth_bp.route("/google", methods=["POST"])
def google_auth():
    data = request.get_json()
    code = data.get("code")
    if not code:
        return jsonify({"error": "No code provided"}), 400

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
        return jsonify({"error": "Token exchange failed"}), 400

    # ② ユーザー情報取得（1回だけ）
    userinfo = requests.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
    ).json()

    google_user_id = userinfo.get("id")
    email = userinfo.get("email")
    name = userinfo.get("name")  # ← Googleアカウント名

    if not email:
        return jsonify({"error": "Failed to get email"}), 400

    # ③ ユーザー作成 or 更新 (アカウント統合)
    user = User.query.filter_by(google_user_id=google_user_id).first()
    
    # Google IDで見つからない場合、メールアドレスで既存ユーザーを検索（統合）
    if not user:
        user = User.query.filter_by(email=email).first()

    # 管理者アカウントはソーシャルログイン禁止
    if user and user.is_administrator:
        return jsonify({"error": "管理者アカウントはソーシャルログインを利用できません"}), 403

    # 新規ユーザーの場合は登録フローへ誘導
    if not user:
        reg_token = jwt.encode({
            "provider": "google",
            "provider_id": google_user_id,
            "email": email,
            "name": name,
            "type": "social_registration",
            "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=15)
        }, current_app.config["SECRET_KEY"], algorithm="HS256")
        
        return jsonify({
            "action": "register",
            "registration_token": reg_token,
            "suggested_username": email.split('@')[0] if email else "",
            "email": email
        })

    # 既存ユーザーの更新
    if not user.google_user_id:
        user.google_user_id = google_user_id
    user.username = name
    user.email = email
    # 最終ログイン日時を更新
    user.last_login_at = datetime.datetime.now(datetime.timezone.utc)

    db.session.commit()

    # ④ JWT 発行
    token = jwt.encode(
        {
            "user_id": user.id,
            "email": user.email,
            "display_name": user.display_name,
            "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7),
        },
        current_app.config["SECRET_KEY"],
        algorithm="HS256",
    )

    return jsonify({
        "token": token,
        "user": {"id": user.id, "username": user.username, "email": user.email, "display_name": user.display_name, "is_admin": user.is_administrator}
    })

# --- LINE ---

@oauth_bp.route("/line", methods=["GET"])
def line_login_url():
    params = {
        "response_type": "code",
        "client_id": current_app.config["LINE_CHANNEL_ID"],
        "redirect_uri": current_app.config["LINE_REDIRECT_URI"],
        "state": "LINE_LOGIN",
        "scope": "profile openid email",
    }
    line_auth_url = "https://access.line.me/oauth2/v2.1/authorize?" + urlencode(params)
    return redirect(line_auth_url)

@oauth_bp.route("/line/callback", methods=["GET"])
def line_callback():
    code = request.args.get("code")
    base_url = current_app.config.get("BASE_URL").rstrip('/')
    frontend_url = f"{base_url}/login/callback?code={code}&provider=line"
    return redirect(frontend_url)

@oauth_bp.route("/line", methods=["POST"])
def line_auth():
    data = request.get_json()
    code = data.get("code")
    if not code:
        return jsonify({"error": "No code provided"}), 400

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
        return jsonify({"error": "LINE token exchange failed"}), 400

    # IDトークンからメールアドレスを取得
    email = None
    if id_token:
        try:
            # 署名検証は省略（LINEプラットフォームからの直接レスポンスのため）
            decoded_id_token = jwt.decode(id_token, options={"verify_signature": False})
            email = decoded_id_token.get("email")
            print(f"DEBUG: LINE ID Token email: {email}")
        except Exception as e:
            print(f"DEBUG: Failed to decode LINE ID token: {e}")

    # ② プロフィール取得
    profile = requests.get(
        "https://api.line.me/v2/profile",
        headers={"Authorization": f"Bearer {access_token}"},
    ).json()

    line_user_id = profile.get("userId")
    display_name = profile.get("displayName")

    if not line_user_id:
        return jsonify({"error": "Failed to get LINE user id"}), 400

    # ③ ユーザー作成 or 取得
    user = User.query.filter_by(line_user_id=line_user_id).first()
    
    # LINE IDで見つからず、メールアドレスがある場合、既存ユーザーを検索（統合）
    if not user and email:
        user = User.query.filter_by(email=email).first()

    # 管理者アカウントはソーシャルログイン禁止
    if user and user.is_administrator:
        return jsonify({"error": "管理者アカウントはソーシャルログインを利用できません"}), 403

    # 新規ユーザーの場合は登録フローへ誘導
    if not user:
        reg_token = jwt.encode({
            "provider": "line",
            "provider_id": line_user_id,
            "email": email,
            "name": display_name,
            "type": "social_registration",
            "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=15)
        }, current_app.config["SECRET_KEY"], algorithm="HS256")
        
        return jsonify({
            "action": "register",
            "registration_token": reg_token,
            "suggested_username": f"line_{line_user_id[:8]}",
            "email": email
        })

    # 既存ユーザーの更新
    if not user.line_user_id:
        user.line_user_id = line_user_id
    user.username = display_name or user.username
    if email: user.email = email
    # 最終ログイン日時を更新
    user.last_login_at = datetime.datetime.now(datetime.timezone.utc)

    db.session.commit()

    # ④ JWT 発行（Googleと同じ）
    token = jwt.encode(
        {
            "user_id": user.id,
            "email": user.email,
            "display_name": user.username,
            "login_type": "line",
            "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7),
        },
        current_app.config["SECRET_KEY"],
        algorithm="HS256",
    )

    return jsonify({
        "token": token,
        "user": {"id": user.id, "username": user.userID, "userID": user.userID, "email": user.email, "display_name": user.username, "is_admin": user.is_administrator}
    })

@oauth_bp.route("/social-register", methods=["POST"])
def social_register():
    data = request.get_json()
    reg_token = data.get("registration_token")
    user_id = data.get("username")
    display_name = data.get("display_name")
    email = data.get("email")

    if not reg_token or not user_id:
        return jsonify({"error": "ユーザーIDは必須です"}), 400

    if not re.match(r'^[a-zA-Z0-9._]{4,}$', user_id):
        return jsonify({'error': 'ユーザーIDは4文字以上の半角英数字、ピリオド、アンダーバーのみ使用可能です'}), 400

    try:
        payload = jwt.decode(reg_token, current_app.config["SECRET_KEY"], algorithms=["HS256"])
        if payload.get("type") != "social_registration":
            raise Exception("Invalid token type")
    except Exception:
        return jsonify({"error": "セッションが無効です。もう一度ログインしてください。"}), 400

    # ユーザー名重複チェック
    if User.query.filter_by(userID=user_id).first():
        return jsonify({"error": "このユーザーIDは既に使用されています"}), 400
    
    # メールアドレス重複チェック（入力された場合）
    if email:
        existing = User.query.filter_by(email=email).first()
        if existing:
            return jsonify({"error": "このメールアドレスは既に使用されています"}), 400

    user = User(
        userID=user_id,
        username=display_name or payload.get("name"),
        email=email,
    )
    
    if payload["provider"] == "google":
        user.google_user_id = payload["provider_id"]
    elif payload["provider"] == "line":
        user.line_user_id = payload["provider_id"]
        
    user.last_login_at = datetime.datetime.now(datetime.timezone.utc)
    
    db.session.add(user)
    db.session.commit()

    # JWT 発行
    token = jwt.encode({
        "user_id": user.id,
        "email": user.email,
        "display_name": user.username,
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7),
    }, current_app.config["SECRET_KEY"], algorithm="HS256")

    return jsonify({
        "token": token,
        "user": {"id": user.id, "username": user.userID, "userID": user.userID, "email": user.email, "display_name": user.username, "is_admin": user.is_administrator}
    })