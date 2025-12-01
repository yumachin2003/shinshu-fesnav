from flask import Blueprint, request, jsonify, current_app, g
from .models import Festivals, User, UserFavorite, UserDiary, EditLog
from datetime import datetime, timedelta
from . import db
from .utils import calculate_concrete_date # 日付計算ユーティリティをインポート
import jwt as pyjwt
import datetime
from functools import wraps

# 'api'という名前でBlueprintを作成
api_bp = Blueprint('api', __name__, url_prefix='/api')

# --- 認証デコレータ ---
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method == 'OPTIONS': # CORSのプリフライトリクエストは認証不要で通過させる
            return jsonify({'message': 'Preflight request successful'}), 200

        token = None
        # リクエストヘッダーからAuthorizationトークンを取得
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1] # 'Bearer <token>' の形式を想定

        if not token:
            return jsonify({'message': 'トークンがありません。認証が必要です。'}), 401

        try:
            # トークンをデコードしてユーザー情報を取得
            data = pyjwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.filter_by(id=data['user_id']).first()
            g.current_user = current_user # リクエストコンテキストにユーザー情報を保存
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
@token_required # 認証デコレータを適用
def get_festivals():
    current_year = datetime.datetime.now().year
    festivals = Festivals.query.all()
    festival_list = []
    for festival in festivals:
        festival_data = festival.to_dict()
        
        # date_rule が存在し、具体的な日付 (date) がない場合、日付を計算する
        if festival_data.get('date_rule') and not festival_data.get('date'):
            calculated_date = calculate_concrete_date(current_year, festival_data['date_rule'])
            if calculated_date:
                festival_data['date'] = calculated_date
        
        # 翌年の日付も計算してみる（例：今年の開催日が既に過ぎている場合）
        if festival_data.get('date'):
            if datetime.datetime.strptime(festival_data['date'], '%Y-%m-%d').date() < datetime.date.today() and festival_data.get('date_rule'):
                 calculated_date_next_year = calculate_concrete_date(current_year + 1, festival_data['date_rule'])
                 if calculated_date_next_year:
                     festival_data['date'] = calculated_date_next_year
        festival_list.append(festival_data)
    return jsonify(festival_list)

# POST /api/festivals : 新しいお祭りを追加
@api_bp.route('/festivals', methods=['POST'])
@token_required # 認証デコレータを適用
def add_festival():
    data = request.get_json()

    # 必須項目のチェック
    if not data or not data.get('name') or not data.get('location'):
        return jsonify({'error': 'Name and location are required'}), 400
    
    # 日付は date または date_rule のどちらかがあればOK
    if not data.get('date') and not data.get('date_rule'):
        return jsonify({'error': 'Either date or date_rule is required'}), 400

    # 同じ名前と日付のお祭りが既に存在するかチェック
    if data.get('date'):
        existing_festival = Festivals.query.filter_by(name=data['name'], date=data['date']).first()
        if existing_festival:
            return jsonify({'error': '同じ名前と日付のお祭りが既に存在します。'}), 409 # 409 Conflict

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
        longitude=data.get('longitude'),
        date_rule=data.get('date_rule')
    )
    db.session.add(new_festival)
    db.session.commit()
    return jsonify(new_festival.to_dict()), 201

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

    new_user = User(username=username, password=password)
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