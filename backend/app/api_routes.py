from flask import Blueprint, request, jsonify, current_app, g
from .models import Festivals, User, UserFavorite, UserDiary, EditLog, Review,  InformationSubmission
from datetime import datetime, timedelta
from . import db
from .utils import calculate_concrete_date # 日付計算ユーティリティをインポート
import jwt as pyjwt
import datetime
from functools import wraps
import requests
from urllib.parse import urlencode

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
            return jsonify({'message': 'トークンがありません。認証が必要です。'}), 401

        try:
            data = pyjwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.filter_by(id=data['user_id']).first()
            g.current_user = current_user
        except pyjwt.ExpiredSignatureError:
            return jsonify({'message': 'トークンの有効期限が切れています。再ログインしてください。'}), 401
        except pyjwt.InvalidTokenError:
            return jsonify({'message': '無効なトークンです。'}), 401

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
    current_year = datetime.datetime.now().year
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
                existing_festival.date = datetime.datetime.strptime(data['date'], '%Y-%m-%d').date()
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
            fes_date = datetime.datetime.strptime(data['date'], '%Y-%m-%d').date()
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
    UserDiary.query.filter_by(festival_id=festival_id).delete()
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
    password = data.get('password')

    # バリデーションを最初に行う
    if not username or not password:
        return jsonify({'error': 'ユーザー名とパスワードは必須です'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'このユーザー名は既に使用されています'}), 400

    new_user = User(username=username)
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

    user = User.query.filter_by(username=username).first()

    # ユーザーが存在し、かつパスワードが一致するかチェック
    if user and user.check_password(password):
        # JWTトークンを生成
        token = pyjwt.encode({
            'user_id': user.id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24) # トークンの有効期限は24時間
        }, current_app.config['SECRET_KEY'], algorithm="HS256")

        # フロントエンドが期待する形式でレスポンスを返す
        return jsonify({
            "token": token,
            "user": { "id": user.id, "username": user.username }
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

    # 日記データの取得
    diaries_list = UserDiary.query.filter_by(user_id=user_id).order_by(UserDiary.timestamp.desc()).all()
    diaries = {}
    for entry in diaries_list:
        if entry.festival_id not in diaries:
            diaries[entry.festival_id] = []
        diaries[entry.festival_id].append(entry.to_dict())

    return jsonify({
        'favorites': favorites,
        'diaries': diaries
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

# POST /api/account/diaries : 日記情報を更新
@api_bp.route('/account/diaries', methods=['POST'])
@token_required
def update_diaries():
    user_id = g.current_user.id
    data = request.get_json()
    new_diaries_data = data.get('diaries', {})

    # 既存の日記をすべて削除
    UserDiary.query.filter_by(user_id=user_id).delete()

    # 新しい日記を追加
    for festival_id_str, entries in new_diaries_data.items():
        try:
            festival_id = int(festival_id_str)
            for entry_data in entries:
                new_diary = UserDiary(
                    user_id=user_id,
                    festival_id=festival_id,
                    text=entry_data.get('text'),
                    image=entry_data.get('image'),
                    timestamp=entry_data.get('timestamp'),
                    date=entry_data.get('date')
                )
                db.session.add(new_diary)
        except ValueError:
            return jsonify({'error': f'Invalid festival_id: {festival_id_str}'}), 400

    db.session.commit()
    return jsonify({'message': 'Diaries updated successfully'}), 200

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

# --- Google OAuth ---

@api_bp.route("/auth/google", methods=["GET"])
def google_login():
    client_id = current_app.config["GOOGLE_CLIENT_ID"]
    redirect_uri = current_app.config["GOOGLE_REDIRECT_URI"]

    scope = "openid email profile"

    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": scope,
        "access_type": "offline",
        "prompt": "consent",
    }

    auth_url = "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)
    return jsonify({"url": auth_url})

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
