from flask import Blueprint, request, jsonify, current_app, g, session, send_from_directory, make_response
from .models import Festivals, User, UserFavorite, EditLog, Review, InformationSubmission, Passkey, FestivalPhoto
from datetime import datetime, timedelta, timezone
from . import db, mail, limiter
from .utils import calculate_concrete_date # 日付計算ユーティリティをインポート
import jwt as pyjwt
from functools import wraps
import requests
import base64
import webauthn
import json
import os
import uuid
from werkzeug.utils import secure_filename
import re
from urllib.parse import urlparse
from sqlalchemy import func

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

# --- Helper Functions ---
def get_rp_id():
    """
    WebAuthn用のRP_IDを環境と接続ホストに応じて動的に取得する
    """
    flask_env = os.getenv('FLASK_ENV', 'development')
    # プロキシ経由のホスト名を優先的に取得
    host_header = request.headers.get('X-Forwarded-Host') or request.host
    host = host_header.split(':')[0]
    
    # ターミナルに必ず表示されるように出力
    print(f"\n[WebAuthn Debug] RP_ID Check\n  Header: {host_header}\n  Extracted: {host}\n  Env: {flask_env}\n")

    
    if flask_env == 'production':
        base_url = os.getenv('BASE_URL')
        if base_url:
            return urlparse(base_url).hostname
        return host

    is_ip = re.match(r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$', host)
    if host == 'localhost' or is_ip:
        return 'localhost'
    return host

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

    # 写真データを一括取得してマッピング
    photos = FestivalPhoto.query.all()
    photos_map = {}
    for p in photos:
        if p.festival_id not in photos_map:
            photos_map[p.festival_id] = []
        photos_map[p.festival_id].append(p.to_dict())

    # お気に入り数を一括取得
    fav_counts = db.session.query(
        UserFavorite.festival_id, func.count(UserFavorite.id)
    ).group_by(UserFavorite.festival_id).all()
    fav_map = {fid: count for fid, count in fav_counts}

    festival_list = []
    for festival in festivals_query:
        festival_data = {
            'id': festival.id, 'name': festival.name, 'date': festival.date.strftime('%Y-%m-%d') if festival.date else None,
            'location': festival.location, 'latitude': festival.latitude, 'longitude': festival.longitude, 'attendance': festival.attendance,
            'description': festival.description, # レスポンスに追加
            'access': festival.access, # レスポンスに追加
            'photos': photos_map.get(festival.id, []), # 写真データを追加
            'favorites': fav_map.get(festival.id, 0) # お気に入り数を追加
        }

        festival_list.append(festival_data)

    return jsonify(festival_list)

# POST /api/festivals : 新しいお祭りを追加
@api_bp.route('/festivals', methods=['POST'])
@token_required
def add_festival():
    # --- root 以外は 403 Forbidden ---
    if not g.current_user.is_administrator:
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

# PUT, DELETE /api/festivals/<int:festival_id>
@api_bp.route('/festivals/<int:festival_id>', methods=['PUT', 'DELETE'])
@token_required
def manage_festival(festival_id):
    # rootユーザーのみ許可
    if not g.current_user.is_administrator:
        return jsonify({'error': '権限がありません'}), 403

    festival = Festivals.query.get(festival_id)
    if not festival:
        return jsonify({'error': 'Festival not found'}), 404

    if request.method == 'PUT':
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        # 各フィールドを更新
        festival.name = data.get('name', festival.name)
        festival.location = data.get('location', festival.location)
        festival.description = data.get('description', festival.description)
        festival.access = data.get('access', festival.access)
        festival.attendance = data.get('attendance', festival.attendance)
        festival.latitude = data.get('latitude', festival.latitude)
        festival.longitude = data.get('longitude', festival.longitude)

        if data.get('date'):
            try:
                festival.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
            except (ValueError, TypeError):
                pass # 日付形式が不正な場合は無視
        
        db.session.commit()
        return jsonify(festival.to_dict()), 200

    elif request.method == 'DELETE':
        # 関連データの削除
        UserFavorite.query.filter_by(festival_id=festival_id).delete()
        Review.query.filter_by(festival_id=festival_id).delete()
        FestivalPhoto.query.filter_by(festival_id=festival_id).delete()
        
        db.session.delete(festival)
        db.session.commit()
        return jsonify({'message': 'Festival deleted successfully'}), 200

# GET /api/festivals/<int:festival_id>/ics : iCal形式のファイルを配信（webcal用）
@api_bp.route('/festivals/<int:festival_id>/ics', methods=['GET'])
def get_festival_ics(festival_id):
    festival = Festivals.query.get(festival_id)
    if not festival:
        return jsonify({'error': 'Not found'}), 404
    
    if not festival.date:
        return jsonify({'error': 'Date not set'}), 400
        
    date_str = festival.date.strftime('%Y%m%d')
    next_day = festival.date + timedelta(days=1)
    next_day_str = next_day.strftime('%Y%m%d')
    now_str = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    
    ics_content = f"""BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Festival Calendar//JP
BEGIN:VEVENT
UID:{festival.id}@festival.jp
DTSTAMP:{now_str}
DTSTART;VALUE=DATE:{date_str}
DTEND;VALUE=DATE:{next_day_str}
SUMMARY:{festival.name}
LOCATION:{festival.location}
DESCRIPTION:{festival.name}（{festival.location}）のお祭りです。
BEGIN:VALARM
TRIGGER:-P1D
ACTION:DISPLAY
DESCRIPTION:Reminder
END:VALARM
END:VEVENT
END:VCALENDAR"""

    response = make_response(ics_content)
    response.headers["Content-Type"] = "text/calendar; charset=utf-8"
    response.headers["Content-Disposition"] = f"attachment; filename=festival_{festival.id}.ics"
    return response

# POST /api/festivals/bulk-update-year : 全てのお祭りの年を一括更新
@api_bp.route('/festivals/bulk-update-year', methods=['POST'])
@token_required
def bulk_update_year():
    if not g.current_user.is_administrator:
        return jsonify({'error': '権限がありません'}), 403

    data = request.get_json()
    target_year = data.get('year')

    if not target_year:
        return jsonify({'error': 'Year is required'}), 400

    festivals = Festivals.query.all()
    count = 0
    for f in festivals:
        if f.date:
            try:
                f.date = f.date.replace(year=int(target_year))
            except ValueError:
                # うるう年(2/29)から平年への変更時の対応 -> 2/28にする
                if f.date.month == 2 and f.date.day == 29:
                    f.date = f.date.replace(year=int(target_year), day=28)
            count += 1

    db.session.commit()
    return jsonify({'message': f'{count}件のお祭りを{target_year}年に更新しました'}), 200

# POST /api/festivals/<festival_id>/photos : お祭りの写真をアップロード
@api_bp.route('/festivals/<int:festival_id>/photos', methods=['POST'])
@token_required
def upload_festival_photo(festival_id):
    # root ユーザーのみ許可（必要に応じて変更してください）
    if not g.current_user.is_administrator:
        return jsonify({'error': '権限がありません'}), 403

    if 'photo' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['photo']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
        
    if file:
        # ファイル名の安全化とユニーク化
        ext = os.path.splitext(file.filename)[1].lower()
        if not ext:
            ext = '.jpg'
        
        unique_filename = f"{festival_id}_{uuid.uuid4().hex}{ext}"
        
        # 保存先ディレクトリ（app/static/uploads）
        upload_dir = os.path.join(current_app.root_path, 'static', 'uploads')
        os.makedirs(upload_dir, exist_ok=True)
        
        file.save(os.path.join(upload_dir, unique_filename))
        
        # DBに保存するURLパス
        image_url = f"/api/uploads/{unique_filename}"
        
        new_photo = FestivalPhoto(festival_id=festival_id, image_url=image_url)
        db.session.add(new_photo)
        db.session.commit()
        
        return jsonify(new_photo.to_dict()), 201

    return jsonify({'error': 'Upload failed'}), 500

# DELETE /api/photos/<photo_id> : 写真を削除
@api_bp.route('/photos/<int:photo_id>', methods=['DELETE'])
@token_required
def delete_photo(photo_id):
    if not g.current_user.is_administrator:
        return jsonify({'error': '権限がありません'}), 403
        
    photo = FestivalPhoto.query.get(photo_id)
    if not photo:
        return jsonify({'error': 'Photo not found'}), 404

    # ファイルの実体削除はここでは省略（必要ならos.removeを追加）
    db.session.delete(photo)
    db.session.commit()
    
    return jsonify({'message': 'Photo deleted successfully'}), 200

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

    user_id = data.get('username') # フロントエンドは 'username' キーでIDを送信
    display_name = data.get('display_name')
    email = data.get('email')
    
    # 空文字のメールアドレスはNoneとして扱う（ユニーク制約回避のため）
    if email == "":
        email = None

    password = data.get('password')

    # バリデーションを最初に行う
    if not user_id or not password:
        return jsonify({'error': 'ユーザーIDとパスワードは必須です'}), 400

    # ユーザーIDのバリデーション (4文字以上の半角英数字・ピリオド・アンダーバー)
    if not re.match(r'^[a-zA-Z0-9._]{4,}$', user_id):
        return jsonify({'error': 'ユーザーIDは4文字以上の半角英数字、ピリオド、アンダーバーのみ使用可能です'}), 400

    if User.query.filter_by(userID=user_id).first():
        return jsonify({'error': 'このユーザーIDは既に使用されています'}), 400
    
    if email and User.query.filter_by(email=email).first():
        return jsonify({'error': 'このメールアドレスは既に登録されています'}), 400

    try:
        new_user = User(userID=user_id, username=display_name or user_id, email=email)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Error during registration: {e}")
        return jsonify({'error': '登録処理中にエラーが発生しました'}), 500

    return jsonify({'message': 'ユーザー登録が成功しました'}), 201

# POST /api/login : ログイン
@api_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    identifier = data.get('username') # フロントエンドからの入力(ID)
    password = data.get('password')

    if not identifier or not password:
        return jsonify({'error': 'ユーザーIDとパスワードを入力してください'}), 400

    # ユーザーIDまたはメールアドレスで検索
    user = User.query.filter_by(userID=identifier).first() or User.query.filter_by(email=identifier).first()

    # ユーザーが存在し、かつパスワードが一致するかチェック
    if user and user.check_password(password):
        # 最終ログイン日時を更新
        user.last_login_at = datetime.now(timezone.utc)
        db.session.commit()

        # JWTトークンを生成
        token = pyjwt.encode({
            'user_id': user.id,
            'email': user.email,
            'display_name': user.username,
            'exp': datetime.now(timezone.utc) + timedelta(hours=24) # トークンの有効期限は24時間
        }, current_app.config['SECRET_KEY'], algorithm="HS256")

        # フロントエンドが期待する形式でレスポンスを返す
        return jsonify({
            "token": token,
            "user": { "id": user.id, "username": user.userID, "userID": user.userID, "email": user.email, "display_name": user.username, "is_admin": user.is_administrator }
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
        'google_connected': bool(g.current_user.google_user_id),
        'line_connected': bool(g.current_user.line_user_id)
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

    new_user_id = data.get('username') # フロントエンドは 'username' キーでIDを送信
    new_display_name = data.get('display_name')
    new_email = data.get('email')
    new_password = data.get('password')

    if new_user_id and new_user_id != user.userID:
        if not re.match(r'^[a-zA-Z0-9._]{4,}$', new_user_id):
            return jsonify({'error': 'ユーザーIDは4文字以上の半角英数字、ピリオド、アンダーバーのみ使用可能です'}), 400
            
        if User.query.filter_by(userID=new_user_id).first():
            return jsonify({'error': 'このユーザーIDは既に使用されています'}), 400
        user.userID = new_user_id

    if new_display_name:
        user.username = new_display_name

    if new_email and new_email != user.email:
        if User.query.filter_by(email=new_email).first():
            return jsonify({'error': 'このメールアドレスは既に使用されています'}), 400
        user.email = new_email

    if new_password:
        user.set_password(new_password)

    db.session.commit()
    return jsonify({
        'message': 'プロフィールを更新しました',
        'user': {'id': user.id, 'username': user.userID, 'userID': user.userID, 'email': user.email, 'display_name': user.username, 'is_admin': user.is_administrator}
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
    username = user.userID if user else data.get('username') # IDを使用
    email = data.get('email')
    
    if not username:
        return jsonify({"error": "ユーザー名を入力してください"}), 400

    rp_id = get_rp_id()
    
    options = webauthn.generate_registration_options(
        rp_id=rp_id,
        rp_name="信州おまつりナビ",
        user_id=str(user.id if user else username).encode(), # user.id (DB PK) を推奨するが、新規時はusername(ID)を使用
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
    
    rp_id = get_rp_id()
    # Originヘッダーがない場合は、現在のホストから推測（開発用）
    origin = request.headers.get('Origin')
    if not origin:
        forwarded_host = request.headers.get('X-Forwarded-Host')
        host_to_use = forwarded_host if forwarded_host else request.host
        origin = f"https://{host_to_use}"
    print(f"DEBUG: Registration Origin: {origin}")

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
            user_id = session.get('registration_username') or "new_user"
            email = session.get('registration_email')
            user = User(userID=user_id, username=user_id, email=email) # userIDとdisplay_nameを同じに設定
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
    identifier = data.get('username')
    
    user = User.query.filter_by(userID=identifier).first() or User.query.filter_by(email=identifier).first()
    if not user:
        return jsonify({"error": "ユーザーが見つかりません"}), 404
    
    passkeys = Passkey.query.filter_by(user_id=user.id).all()
    if not passkeys:
        return jsonify({"error": "パスキーが登録されていません"}), 400

    rp_id = get_rp_id()
    
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
    session['authentication_username'] = user.userID # 確実に存在するuserIDを保存
    
    return jsonify(json.loads(webauthn.options_to_json(options)))

@api_bp.route('/login/verify', methods=['POST'])
def passkey_login_verify():
    auth_data = request.get_json()
    challenge_b64 = session.get('authentication_challenge')
    user_id_val = session.get('authentication_username')
    
    if not challenge_b64 or not user_id_val:
        return jsonify({"error": "セッションがタイムアウトしました。もう一度やり直してください。"}), 400
    
    user = User.query.filter_by(userID=user_id_val).first()
    passkey = Passkey.query.filter_by(credential_id=auth_data.get('id')).first()
    
    if not passkey or passkey.user_id != user.id:
        return jsonify({"error": "無効なパスキーです"}), 400

    rp_id = get_rp_id()
    # Originヘッダーがない場合は、現在のホストから推測（開発用）
    origin = request.headers.get('Origin')
    if not origin:
        forwarded_host = request.headers.get('X-Forwarded-Host')
        host_to_use = forwarded_host if forwarded_host else request.host
        origin = f"https://{host_to_use}"

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
        
        # 最終ログイン日時を更新
        user.last_login_at = datetime.now(timezone.utc)
        
        db.session.commit()

        # JWT発行
        token = pyjwt.encode({
            'user_id': user.id,
            'email': user.email,
            'display_name': user.username or user.username,
            'exp': datetime.now(timezone.utc) + timedelta(hours=24)
        }, current_app.config['SECRET_KEY'], algorithm="HS256")

        session.pop('authentication_challenge', None)
        session.pop('authentication_username', None)

        return jsonify({
            "token": token,
            "user": { "id": user.id, "username": user.userID, "userID": user.userID, "email": user.email, "display_name": user.username, "is_admin": user.is_administrator }
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# --- Passkey Management API ---

@api_bp.route('/account/passkeys', methods=['GET'])
@token_required
def get_user_passkeys():
    user = g.current_user
    passkeys = Passkey.query.filter_by(user_id=user.id).all()
    return jsonify([{
        'id': pk.id,
        'credential_id': pk.credential_id
    } for pk in passkeys]), 200

@api_bp.route('/account/passkeys/<int:passkey_id>', methods=['DELETE'])
@token_required
def delete_passkey(passkey_id):
    user = g.current_user
    print(f"DEBUG: Delete passkey request - ID: {passkey_id}, User: {user.userID}")
    
    passkey = db.session.get(Passkey, passkey_id)
    if not passkey or passkey.user_id != user.id:
        print(f"DEBUG: Passkey not found or unauthorized. ID: {passkey_id}")
        return jsonify({"error": "パスキーが見つかりません"}), 404
    db.session.delete(passkey)
    db.session.commit()
    return jsonify({"message": "削除しました"}), 200

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
    if not g.current_user.is_administrator:
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
    if not g.current_user.is_administrator:
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
    if not g.current_user.is_administrator:
        return jsonify({'error': '権限がありません'}), 403
    
    users = User.query.all()
    return jsonify([{
        'id': u.id,
        'username': u.userID, # フロントエンド互換性のため username キーに userID を入れる
        'userID': u.userID,
        'display_name': u.username,
        'email': u.email,
        'google_user_id': u.google_user_id,
        'line_user_id': u.line_user_id,
        'google_connected': bool(u.google_user_id),
        'line_connected': bool(u.line_user_id),
        'is_admin': u.is_administrator,
        'passkey_registered': bool(Passkey.query.filter_by(user_id=u.id).first()),
        'passkeys': [{'id': pk.id, 'credential_id': pk.credential_id, 'sign_count': pk.sign_count} for pk in Passkey.query.filter_by(user_id=u.id).all()],
        'last_login_at': u.last_login_at.replace(tzinfo=timezone.utc).isoformat() if u.last_login_at else None
    } for u in users]), 200

@api_bp.route('/admin/users', methods=['POST'])
@token_required
def create_admin_user():
    # root ユーザーまたは管理者のみアクセス許可
    if not g.current_user.is_administrator:
        return jsonify({'error': '権限がありません'}), 403

    data = request.get_json()
    user_id = data.get('username')
    display_name = data.get('display_name')
    email = data.get('email')
    password = data.get('password')
    
    if not user_id or not password:
        return jsonify({'error': 'ユーザーIDとパスワードは必須です'}), 400

    if not re.match(r'^[a-zA-Z0-9._]{4,}$', user_id):
        return jsonify({'error': 'ユーザーIDは4文字以上の半角英数字、ピリオド、アンダーバーのみ使用可能です'}), 400

    if User.query.filter_by(userID=user_id).first():
        return jsonify({'error': 'このユーザーIDは既に使用されています'}), 400

    # 管理者として作成
    new_user = User(userID=user_id, username=display_name or user_id, email=email, is_admin=True)
    new_user.set_password(password)
    
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': '管理者ユーザーを作成しました', 'user': {'id': new_user.id, 'username': new_user.userID}}), 201

@api_bp.route('/admin/users/<int:user_id>/role', methods=['POST'])
@token_required
def change_user_role(user_id):
    if not g.current_user.is_administrator:
        return jsonify({'error': '権限がありません'}), 403
    
    data = request.get_json()
    is_admin_flag = data.get('is_admin')
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if user.userID == 'root':
         return jsonify({'error': 'rootユーザーの権限は変更できません'}), 400
         
    user.is_admin = is_admin_flag
    db.session.commit()
    return jsonify({'message': 'Role updated'}), 200

@api_bp.route('/admin/users/<int:user_id>', methods=['PUT', 'DELETE'])
@token_required
def manage_admin_user(user_id):
    # root ユーザーのみアクセス許可
    if not g.current_user.is_administrator:
        return jsonify({'error': '権限がありません'}), 403
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if request.method == 'PUT':
        data = request.get_json()
        new_user_id = data.get('username')
        new_display_name = data.get('display_name')
        email = data.get('email')
        password = data.get('password')

        if new_user_id and new_user_id != user.userID:
            if user.userID == 'root':
                return jsonify({'error': 'rootユーザーのユーザーIDは変更できません'}), 400
            if not re.match(r'^[a-zA-Z0-9._]{4,}$', new_user_id):
                return jsonify({'error': 'ユーザーIDは4文字以上の半角英数字、ピリオド、アンダーバーのみ使用可能です'}), 400
            if User.query.filter_by(userID=new_user_id).first():
                return jsonify({'error': 'このユーザーIDは既に使用されています'}), 400
            user.userID = new_user_id

        if new_display_name:
            user.username = new_display_name

        if email and email != user.email:
            if User.query.filter_by(email=email).first():
                return jsonify({'error': 'このメールアドレスは既に使用されています'}), 400
            user.email = email

        if password:
            user.set_password(password)

        db.session.commit()
        return jsonify({'message': 'ユーザー情報を更新しました', 'user': {'id': user.id, 'username': user.userID}}), 200

    elif request.method == 'DELETE':
        if user.userID == "root":
            return jsonify({'error': 'rootユーザー自身を削除することはできません'}), 400

        # 関連データの削除（外部キー制約エラーを防ぐため）
        UserFavorite.query.filter_by(user_id=user_id).delete()
        Review.query.filter_by(user_id=user_id).delete()
        EditLog.query.filter_by(user_id=user_id).delete()
        Passkey.query.filter_by(user_id=user_id).delete()
        
        db.session.delete(user)
        db.session.commit()
        return jsonify({'message': 'ユーザーを削除しました'}), 200

# --- Static Files API ---

@api_bp.route('/uploads/<filename>')
def serve_uploaded_file(filename):
    return send_from_directory(os.path.join(current_app.root_path, 'static', 'uploads'), filename)
