from flask import Blueprint, request, jsonify, current_app
from .models import User
from . import db, limiter
import os
from flask_mailman import EmailMessage
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadTimeSignature

pw_reset_bp = Blueprint('pw_reset', __name__, url_prefix='/api')

# POST /api/forgot-password : パスワードリセットメール送信
@pw_reset_bp.route('/forgot-password', methods=['POST'])
@limiter.limit("3 per hour")
def forgot_password():
    email = request.json.get('email')
    if not email:
        return jsonify({"message": "Email is required"}), 400

    # ユーザー確認
    user = User.query.filter_by(email=email).first()
    if not user:
        # セキュリティのため、ユーザーが存在しなくても成功メッセージを返すのが一般的ですが、
        # ここでは開発用に404を返すか、あるいは200で「送信しました」と返すか選択できます。
        # 今回は安全のため200を返します。
        return jsonify({"message": "Password reset email sent"}), 200

    s = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    token = s.dumps(email, salt='password-reset-salt')

    frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
    reset_url = f"{frontend_url}/reset-password/{token}"

    try:
        msg = EmailMessage(
            subject="パスワードリセットのご案内",
            body=f"以下のリンクからパスワードを再設定してください:\n\n{reset_url}\n\n※このリンクは1時間有効です。",
            to=[email]
        )
        msg.send()
    except Exception as e:
        print(f"Error sending email: {e}")
        return jsonify({"message": "Failed to send email"}), 500

    return jsonify({"message": "Password reset email sent"}), 200

# POST /api/reset-password : パスワード再設定
@pw_reset_bp.route('/reset-password', methods=['POST'])
@limiter.limit("10 per minute")
def reset_password():
    token = request.json.get('token')
    new_password = request.json.get('new_password')

    if not token or not new_password:
        return jsonify({"message": "Token and new password are required"}), 400

    s = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    try:
        email = s.loads(token, salt='password-reset-salt', max_age=3600)
    except SignatureExpired:
        return jsonify({"message": "The token has expired"}), 400
    except BadTimeSignature:
        return jsonify({"message": "Invalid token"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"message": "User not found"}), 404

    user.set_password(new_password)
    db.session.commit()

    return jsonify({"message": "Password has been reset successfully", "email": email}), 200