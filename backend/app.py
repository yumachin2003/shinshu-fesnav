import os
from flask import Flask, request, jsonify, session
from flask_cors import CORS
from webauthn import (
    generate_registration_options,
    verify_registration_response,
    generate_authentication_options,
    verify_authentication_response,
    options_to_json,
)
from webauthn.helpers.structs import (
    RegistrationCredential,
    AuthenticationCredential,
    AuthenticatorSelectionCriteria,
    UserVerificationRequirement,
    AuthenticatorAttachment,
)

app = Flask(__name__)
app.secret_key = os.urandom(24)
CORS(app, supports_credentials=True)  # フロントエンドからのクッキー/セッションを許可

RP_ID = "localhost"
RP_NAME = "Shinshu FesNav"
ORIGIN = "http://localhost:3000"  # フロントエンドのURL

# 簡易データベース
users = {}  # { username: { "id": bytes, "credentials": [ { "id": bytes, "public_key": bytes, "sign_count": int } ] } }

# --- 登録 (Registration) ---

@app.route("/api/register/options", methods=["POST"])
def register_options():
    username = request.json.get("username")
    if not username:
        return jsonify({"error": "Username is required"}), 400

    user_id = os.urandom(16)
    # 既存ユーザーのチェック
    if username in users:
        user_id = users[username]["id"]
    else:
        users[username] = {"id": user_id, "credentials": []}

    options = generate_registration_options(
        rp_id=RP_ID,
        rp_name=RP_NAME,
        user_id=user_id,
        user_name=username,
        authenticator_selection=AuthenticatorSelectionCriteria(
            authenticator_attachment=AuthenticatorAttachment.PLATFORM, # パスキー（デバイス内蔵）を優先
            user_verification=UserVerificationRequirement.PREFERRED,
        ),
    )
    session["reg_challenge"] = options.challenge
    session["reg_username"] = username
    return options_to_json(options)

@app.route("/api/register/verify", methods=["POST"])
def register_verify():
    challenge = session.get("reg_challenge")
    username = session.get("reg_username")
    if not challenge or not username:
        return jsonify({"error": "Invalid session"}), 400

    try:
        registration_verification = verify_registration_response(
            credential=RegistrationCredential.parse_obj(request.json),
            expected_challenge=challenge,
            expected_origin=ORIGIN,
            expected_rp_id=RP_ID,
        )
        
        # 公開鍵情報を保存
        new_credential = {
            "id": registration_verification.credential_id,
            "public_key": registration_verification.credential_public_key,
            "sign_count": registration_verification.sign_count,
        }
        users[username]["credentials"].append(new_credential)
        
        return jsonify({"status": "ok"})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# --- ログイン (Authentication) ---

@app.route("/api/login/options", methods=["POST"])
def login_options():
    username = request.json.get("username")
    user = users.get(username)
    if not user or not user["credentials"]:
        return jsonify({"error": "User not found"}), 404

    options = generate_authentication_options(
        rp_id=RP_ID,
        allow_credentials=[
            {"id": cred["id"], "type": "public-key"} for cred in user["credentials"]
        ],
        user_verification=UserVerificationRequirement.PREFERRED,
    )
    session["auth_challenge"] = options.challenge
    session["auth_username"] = username
    return options_to_json(options)

@app.route("/api/login/verify", methods=["POST"])
def login_verify():
    challenge = session.get("auth_challenge")
    username = session.get("auth_username")
    user = users.get(username)

    if not challenge or not user:
        return jsonify({"error": "Invalid session"}), 400

    credential_data = AuthenticationCredential.parse_obj(request.json)
    # 対応する公開鍵を検索
    db_credential = next((c for c in user["credentials"] if c["id"] == credential_data.raw_id), None)

    try:
        auth_verification = verify_authentication_response(
            credential=credential_data,
            expected_challenge=challenge,
            expected_origin=ORIGIN,
            expected_rp_id=RP_ID,
            credential_public_key=db_credential["public_key"],
            credential_current_sign_count=db_credential["sign_count"],
        )
        db_credential["sign_count"] = auth_verification.new_sign_count
        return jsonify({"status": "ok"})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == "__main__":
    app.run(port=5000, debug=True)