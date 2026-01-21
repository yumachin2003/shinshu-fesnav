from flask import Blueprint, request, jsonify, current_app, g, session
from .models import Festivals, User, UserFavorite, EditLog, Review, InformationSubmission, Passkey
from datetime import datetime, timedelta, timezone
from . import db
from .utils import calculate_concrete_date # 日付計算ユーティリティをインポート
import jwt as pyjwt
from functools import wraps
import requests
import base64
import webauthn
import json

# 'api'という名前でBlueprintを作成
api_bp = Blueprint('api', __name__, url_prefix='/api')

# --- 認証デコレータ ---
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]

        if not token:
            return jsonify({'error': 'トークンがありません。認証が必要です。'}), 401

        try:
            data = pyjwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.filter_by(id=data['user_id']).first()
            if not current_user:
                return jsonify({'error': 'ユーザーが見つかりません。'}), 401
            g.current_user = current_user
        except pyjwt.ExpiredSignatureError:
            return jsonify({'error': 'トークンの有効期限が切れています。再ログインしてください。'}), 401
        except pyjwt.InvalidTokenError:
            return jsonify({'error': '無効なトークンです。'}), 401
        except Exception as e:
            return jsonify({'error': f'認証エラー: {str(e)}'}), 401

        return f(*args, **kwargs)
    return decorated

# --- Debug API ---

# GET /api/test : バックエンドサーバーとの接続テスト用
@api_bp.route('/test', methods=['GET'])
def test_connection():
    return jsonify({'status': 'ok', 'message': 'Flask server is running!'})

# --- Festival API ---

# GET /api/festivals : 全てのお祭りを取得
@api_bp.route('/festivals', methods=['GET'])
def get_festivals():
    # 必要なカラムのみを明示的に取得する
    festivals_query = db.session.query(
        Festivals.id,
        Festivals.name,
        Festivals.date,
        Festivals.location,
        Festivals.latitude,
        Festivals.longitude,
        Festivals.attendance,
        Festivals.description, # descriptionを追加
        Festivals.access, # accessを追加
    ).all()

    festival_list = []
    for festival in festivals_query:
        festival_data = {
            'id': festival.id, 'name': festival.name, 'date': festival.date.strftime('%Y-%m-%d') if festival.date else None,
            'location': festival.location, 'latitude': festival.latitude, 'longitude': festival.longitude, 'attendance': festival.attendance,
            'description': festival.description, # レスポンスに追加
            'access': festival.access # レスポンスに追加
        }

        festival_list.append(festival_data)

    return jsonify(festival_list)

# POST /api/festivals : 新しいお祭りを追加
@api_bp.route('/festivals', methods=['POST'])
@token_required
def add_festival():
    # --- root 以外は 403 Forbidden ---
    if g.current_user.username != "root":
        return jsonify({'error': '権限がありません（root のみ追加可能）'}), 403

    data = request.get_json()

    # 必須項目のチェック
    if not data or not data.get('name') or not data.get('location'):
        return jsonify({'error': 'Name and location are required'}), 400
    
    # 同じ名前のお祭りが既に存在するかチェック (日付更新のため名前のみで検索)
    existing_festival = Festivals.query.filter_by(name=data['name']).first()
    if existing_festival:
        # 既に存在する場合は情報を更新する (Upsert)
        if data.get('date'):
            try:
                existing_festival.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
            except (ValueError, TypeError):
                pass

        existing_festival.description = data.get('description', existing_festival.description)
        existing_festival.access = data.get('access', existing_festival.access)
        existing_festival.attendance = data.get('attendance', existing_festival.attendance)
        existing_festival.latitude = data.get('latitude', existing_festival.latitude)
        existing_festival.longitude = data.get('longitude', existing_festival.longitude)
        existing_festival.location = data.get('location', existing_festival.location)
        
        db.session.commit()
        return jsonify(existing_festival.to_dict()), 200

    fes_date = None
    try:
        if data.get('date'):
            fes_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
    except (ValueError, TypeError):
        # dateが空文字列やNoneの場合も考慮
        pass

    new_festival = Festivals(
        name=data['name'],
        date=fes_date,
        location=data['location'],
        description=data.get('description'),
        access=data.get('access'),
        attendance=data.get('attendance'),
        latitude=data.get('latitude'),
        longitude=data.get('longitude')
    )
    db.session.add(new_festival)
    db.session.commit()
    return jsonify(new_festival.to_dict()), 201

# DELETE /api/festivals/<int:festival_id> : お祭りを削除
@api_bp.route('/festivals/<int:festival_id>', methods=['DELETE'])
@token_required
def delete_festival(festival_id):
    # 権限チェック (必要に応じて有効化)
    # if g.current_user.username != "root":
    #     return jsonify({'error': '権限がありません'}), 403

    festival = Festivals.query.get(festival_id)
    if not festival:
        return jsonify({'error': 'Festival not found'}), 404

    # 関連データの削除
    UserFavorite.query.filter_by(festival_id=festival_id).delete()
    Review.query.filter_by(festival_id=festival_id).delete()
    
    db.session.delete(festival)
    db.session.commit()
    return jsonify({'message': 'Festival deleted successfully'}), 200

# --- Review API ---

# GET /api/festivals/<festival_id>/reviews : 特定のお祭りのレビューを取得
@api_bp.route('/festivals/<int:festival_id>/reviews', methods=['GET'])
def get_reviews_for_festival(festival_id):
    reviews = Review.query.filter_by(festival_id=festival_id).order_by(Review.created_at.desc()).all()
    return jsonify([review.to_dict() for review in reviews]), 200

# POST /api/festivals/<festival_id>/reviews : 新しいレビューを投稿
@api_bp.route('/festivals/<int:festival_id>/reviews', methods=['POST'])
@token_required
def post_review(festival_id):
    data = request.get_json()
    if not data or 'rating' not in data or 'comment' not in data:
        return jsonify({'error': 'Rating and comment are required'}), 400

    new_review = Review(
        festival_id=festival_id,
        user_id=g.current_user.id,
        rating=data['rating'],
        comment=data['comment']
    )
    db.session.add(new_review)
    db.session.commit()

    return jsonify(new_review.to_dict()), 201


# --- Auth API ---

# POST /api/register : 新規ユーザー登録
@api_bp.route('/register', methods=['POST'])
def register():
    print(f"Register endpoint hit. Request method: {request.method}")
    
    data = request.get_json()

    if not data:
        return jsonify({'error': 'リクエストボディが不正なJSON形式か空です'}), 400

    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    # バリデーションを最初に行う
    if not username or not password:
        return jsonify({'error': 'ユーザー名とパスワードは必須です'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'このユーザー名は既に使用されています'}), 400
    
    if email and User.query.filter_by(email=email).first():
        return jsonify({'error': 'このメールアドレスは既に登録されています'}), 400

    new_user = User(username=username, email=email)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': 'ユーザー登録が成功しました'}), 201

# POST /api/login : ログイン
@api_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'ユーザー名とパスワードを入力してください'}), 400

    # ユーザー名またはメールアドレスで検索
    user = User.query.filter_by(username=username).first() or User.query.filter_by(email=username).first()

    # ユーザーが存在し、かつパスワードが一致するかチェック
    if user and user.check_password(password):
        # JWTトークンを生成
        token = pyjwt.encode({
            'user_id': user.id,
            'email': user.email,
            'display_name': user.display_name or user.username,
            'exp': datetime.now(timezone.utc) + timedelta(hours=24) # トークンの有効期限は24時間
        }, current_app.config['SECRET_KEY'], algorithm="HS256")

        # フロントエンドが期待する形式でレスポンスを返す
        return jsonify({
            "token": token,
            "user": { "id": user.id, "username": user.username, "email": user.email, "display_name": user.display_name }
        })

    return jsonify({'error': 'ユーザー名またはパスワードが正しくありません'}), 401

# --- Account API ---

# GET /api/account/data : ログイン中のユーザーのアカウントデータを取得
@api_bp.route('/account/data', methods=['GET'])
@token_required
def get_account_data():
    user_id = g.current_user.id

    # お気に入りデータの取得
    favorites_list = UserFavorite.query.filter_by(user_id=user_id).all()
    favorites = {str(fav.festival_id): True for fav in favorites_list}

    return jsonify({
        'favorites': favorites,
    }), 200

# POST /api/account/favorites : お気に入り情報を更新
@api_bp.route('/account/favorites', methods=['POST'])
@token_required
def update_favorites():
    user_id = g.current_user.id
    data = request.get_json()
    new_favorites = data.get('favorites', {})

    # 既存のお気に入りをすべて削除
    UserFavorite.query.filter_by(user_id=user_id).delete()

    # 新しいお気に入りを追加
    for festival_id_str, is_favorite in new_favorites.items():
        if is_favorite:
            try:
                festival_id = int(festival_id_str)
                new_fav = UserFavorite(user_id=user_id, festival_id=festival_id)
                db.session.add(new_fav)
            except ValueError:
                return jsonify({'error': f'Invalid festival_id: {festival_id_str}'}), 400

    db.session.commit()
    return jsonify({'message': 'Favorites updated successfully'}), 200

# PATCH /api/account/profile : プロフィール情報（ユーザー名・パスワード）を更新
@api_bp.route('/account/profile', methods=['PATCH'])
@token_required
def update_profile():
    user = g.current_user
    data = request.get_json()

    new_username = data.get('username')
    new_email = data.get('email')
    new_password = data.get('password')

    if new_username and new_username != user.username:
        if User.query.filter_by(username=new_username).first():
            return jsonify({'error': 'このユーザー名は既に使用されています'}), 400
        user.username = new_username
        user.display_name = new_username # 表示名も同期させる例

    if new_email and new_email != user.email:
        if User.query.filter_by(email=new_email).first():
            return jsonify({'error': 'このメールアドレスは既に使用されています'}), 400
        user.email = new_email

    if new_password:
        user.set_password(new_password)

    db.session.commit()
    return jsonify({
        'message': 'プロフィールを更新しました',
        'user': {'id': user.id, 'username': user.username, 'email': user.email, 'display_name': user.display_name}
    }), 200

# --- Passkey (WebAuthn) API ---

@api_bp.route('/register/options', methods=['POST'])
def passkey_register_options():
    # ログイン中ならそのユーザー、未ログインならリクエストのusernameを使用
    user = None
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith("Bearer "):
        try:
            token = auth_header.split(" ")[1]
            data = pyjwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            user = User.query.get(data['user_id'])
        except:
            pass

    data = request.get_json()
    username = user.username if user else data.get('username')
    email = data.get('email')
    
    if not username:
        return jsonify({"error": "ユーザー名を入力してください"}), 400

    rp_id = request.host.split(':')[0]
    
    options = webauthn.generate_registration_options(
        rp_id=rp_id,
        rp_name="Shinshu FesNav",
        user_id=str(user.id if user else username).encode(),
        user_name=username,
        user_display_name=username,
        attestation=webauthn.helpers.structs.AttestationConveyancePreference.NONE,
        authenticator_selection=webauthn.helpers.structs.AuthenticatorSelectionCriteria(
            authenticator_attachment=webauthn.helpers.structs.AuthenticatorAttachment.PLATFORM,
            user_verification=webauthn.helpers.structs.UserVerificationRequirement.PREFERRED,
        ),
    )
    
    # チャレンジをセッションに保存（bytesはJSON化できないのでbase64文字列にする）
    session['registration_challenge'] = base64.b64encode(options.challenge).decode('utf-8')
    session['registration_username'] = username
    session['registration_email'] = email
    
    return jsonify(json.loads(webauthn.options_to_json(options)))

@api_bp.route('/register/verify', methods=['POST'])
def passkey_register_verify():
    reg_data = request.get_json()
    
    # ログイン中ユーザーの取得試行
    user = None
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith("Bearer "):
        try:
            token = auth_header.split(" ")[1]
            data = pyjwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            user = User.query.get(data['user_id'])
        except:
            pass

    challenge_b64 = session.get('registration_challenge')
    
    if not challenge_b64:
        return jsonify({"error": "チャレンジが見つかりません。もう一度やり直してください。"}), 400
    
    rp_id = request.host.split(':')[0]
    origin = request.headers.get('Origin')

    try:
        verification = webauthn.verify_registration_response(
            credential=reg_data,
            expected_challenge=base64.b64decode(challenge_b64),
            expected_rp_id=rp_id,
            expected_origin=origin,
        )
        
        # 重複チェック
        if Passkey.query.filter_by(credential_id=reg_data.get('id')).first():
            return jsonify({"error": "このパスキーは既に登録されています"}), 400

        # 未ログイン（新規登録）の場合、ユーザーを作成
        if not user:
            # クライアント側から送られたID（ここではusernameをIDとして使用した想定）
            username = reg_data.get('response', {}).get('userHandle') # 本来はIDをデコード
            # 簡易的に、optionsで指定した名前を使用（実際は検証結果から取得）
            username = session.get('registration_username') or "new_user"
            email = session.get('registration_email')
            user = User(username=username, email=email)
            db.session.add(user)
            db.session.flush() # IDを確定させる

        new_passkey = Passkey(
            user_id=user.id,
            credential_id=reg_data.get('id'), # Base64URL文字列として保存
            public_key=verification.credential_public_key,
            sign_count=verification.sign_count,
            transports=json.dumps(reg_data.get('response', {}).get('transports', []))
        )
        db.session.add(new_passkey)
        db.session.commit()
        
        session.pop('registration_challenge', None)
        session.pop('registration_username', None)
        return jsonify({"status": "ok"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@api_bp.route('/login/options', methods=['POST'])
def passkey_login_options():
    data = request.get_json()
    username = data.get('username')
    
    user = User.query.filter_by(username=username).first() or User.query.filter_by(email=username).first()
    if not user:
        return jsonify({"error": "ユーザーが見つかりません"}), 404
    
    passkeys = Passkey.query.filter_by(user_id=user.id).all()
    if not passkeys:
        return jsonify({"error": "パスキーが登録されていません"}), 400

    rp_id = request.host.split(':')[0]
    
    # 登録済みのクレデンシャルIDをデコードしてリスト化
    def b64_to_bin(s):
        return base64.urlsafe_b64decode(s + '=' * (4 - len(s) % 4))

    allow_credentials = [
        webauthn.helpers.structs.PublicKeyCredentialDescriptor(id=b64_to_bin(pk.credential_id)) 
        for pk in passkeys
    ]

    options = webauthn.generate_authentication_options(
        rp_id=rp_id,
        allow_credentials=allow_credentials,
        user_verification=webauthn.helpers.structs.UserVerificationRequirement.PREFERRED,
    )
    
    session['authentication_challenge'] = base64.b64encode(options.challenge).decode('utf-8')
    session['authentication_username'] = user.username # 確実に存在するusernameを保存
    
    return jsonify(json.loads(webauthn.options_to_json(options)))

@api_bp.route('/login/verify', methods=['POST'])
def passkey_login_verify():
    auth_data = request.get_json()
    challenge_b64 = session.get('authentication_challenge')
    username = session.get('authentication_username')
    
    if not challenge_b64 or not username:
        return jsonify({"error": "セッションがタイムアウトしました。もう一度やり直してください。"}), 400
    
    user = User.query.filter_by(username=username).first()
    passkey = Passkey.query.filter_by(credential_id=auth_data.get('id')).first()
    
    if not passkey or passkey.user_id != user.id:
        return jsonify({"error": "無効なパスキーです"}), 400

    rp_id = request.host.split(':')[0]
    origin = request.headers.get('Origin')

    try:
        verification = webauthn.verify_authentication_response(
            credential=auth_data,
            expected_challenge=base64.b64decode(challenge_b64),
            expected_rp_id=rp_id,
            expected_origin=origin,
            credential_public_key=passkey.public_key,
            credential_current_sign_count=passkey.sign_count,
        )
        
        # sign_count 更新
        passkey.sign_count = verification.new_sign_count
        db.session.commit()

        # JWT発行
        token = pyjwt.encode({
            'user_id': user.id,
            'email': user.email,
            'display_name': user.display_name or user.username,
            'exp': datetime.now(timezone.utc) + timedelta(hours=24)
        }, current_app.config['SECRET_KEY'], algorithm="HS256")

        session.pop('authentication_challenge', None)
        session.pop('authentication_username', None)

        return jsonify({
            "token": token,
            "user": { "id": user.id, "username": user.username, "email": user.email, "display_name": user.display_name }
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# --- EditLog API ---

# GET /api/editlogs : ログイン中のユーザーの編集履歴を取得
@api_bp.route('/editlogs', methods=['GET'])
@token_required
def get_edit_logs():
    user_id = g.current_user.id
    logs = EditLog.query.filter_by(user_id=user_id).order_by(EditLog.date.desc()).all()
    return jsonify([log.to_dict() for log in logs]), 200

# POST /api/editlogs : 新しい編集履歴を保存
@api_bp.route('/editlogs', methods=['POST'])
@token_required
def add_edit_log():
    data = request.get_json()
    user_id = g.current_user.id

    festival_id = data.get('festival_id')
    festival_name = data.get('festival_name')
    content = data.get('content')
    date_str = data.get('date')

    if not all([festival_id, festival_name, content, date_str]):
        return jsonify({'error': 'Missing edit log data'}), 400

    try:
        # ISO形式の文字列をdatetimeオブジェクトに変換
        # Python 3.11以降はfromisoformatがZを直接扱えるが、互換性のためreplace
        log_date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use ISO format.'}), 400

    new_log = EditLog(user_id=user_id, festival_id=festival_id, festival_name=festival_name, content=content, date=log_date)
    db.session.add(new_log)
    db.session.commit()
    return jsonify(new_log.to_dict()), 201

@api_bp.route("/information", methods=["POST"])
def submit_information():
    data = request.get_json()

    if not data or not data.get("title") or not data.get("content"):
        return jsonify({"error": "title and content are required"}), 400

    info = InformationSubmission(
        festival_id=data.get("festival_id"),
        festival_name=data.get("festival_name"),
        title=data["title"],
        content=data["content"],
        submitter_name=data.get("name"),
        submitter_email=data.get("email"),
    )
    db.session.add(info)
    db.session.commit()

    return jsonify({"message": "submitted"}), 201

@api_bp.route("/information", methods=["GET"])
@token_required
def get_information_list():
    if g.current_user.username != "root":
        return jsonify({"error": "forbidden"}), 403

    infos = InformationSubmission.query.order_by(
        InformationSubmission.created_at.desc()
    ).all()

    return jsonify([i.to_dict() for i in infos])

# 対処済みにする POST API（旧PATCHを置き換え）
@api_bp.route("/information/<int:info_id>/check", methods=["POST"])
@token_required
def check_information(info_id):
    # rootユーザーのみ
    if g.current_user.username != "root":
        return jsonify({"error": "forbidden"}), 403

    info = InformationSubmission.query.get(info_id)
    if not info:
        return jsonify({"error": "情報提供が見つかりません"}), 404

    info.is_checked = True
    db.session.commit()
    return jsonify(info.to_dict()), 200

# --- Admin User API ---

@api_bp.route('/admin/users', methods=['GET'])
@token_required
def get_admin_users():
    # root ユーザーのみアクセス許可
    if g.current_user.username != "root":
        return jsonify({'error': '権限がありません'}), 403
    
    users = User.query.all()
    return jsonify([{
        'id': u.id,
        'username': u.username,
        'display_name': u.display_name,
        'email': u.email
    } for u in users]), 200

@api_bp.route('/admin/users/<int:user_id>', methods=['DELETE'])
@token_required
def delete_admin_user(user_id):
    # root ユーザーのみアクセス許可
    if g.current_user.username != "root":
        return jsonify({'error': '権限がありません'}), 403
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'ユーザーが見つかりません'}), 404
    
    if user.username == "root":
        return jsonify({'error': 'rootユーザー自身を削除することはできません'}), 400

    # 関連データの削除（外部キー制約エラーを防ぐため）
    UserFavorite.query.filter_by(user_id=user_id).delete()
    Review.query.filter_by(user_id=user_id).delete()
    EditLog.query.filter_by(user_id=user_id).delete()
    
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'ユーザーを削除しました'}), 200
