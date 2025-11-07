from flask import Blueprint, request, jsonify, current_app, g
from .models import Festivals, User
from datetime import datetime
from . import db
import jwt
import datetime
from functools import wraps

# 'api'という名前でBlueprintを作成
api_bp = Blueprint('api', __name__, url_prefix='/api')

# --- 認証デコレータ ---
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # プリフライトリクエスト(OPTIONS)の場合は、トークンチェックをスキップする
        if request.method == 'OPTIONS':
            return f(*args, **kwargs)

        token = None
        # リクエストヘッダーからAuthorizationトークンを取得
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1] # 'Bearer <token>' の形式を想定

        if not token:
            return jsonify({'message': 'トークンがありません。認証が必要です。'}), 401

        try:
            # トークンをデコードしてユーザー情報を取得
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.filter_by(id=data['user_id']).first()
            g.current_user = current_user # リクエストコンテキストにユーザー情報を保存
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'トークンの有効期限が切れています。再ログインしてください。'}), 401
        except jwt.InvalidTokenError:
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
    festivals = Festivals.query.all()
    return jsonify([festival.to_dict() for festival in festivals])

# POST /api/festivals : 新しいお祭りを追加
@api_bp.route('/festivals', methods=['POST'])
@token_required # 認証デコレータを適用
def add_festival():
    data = request.get_json()

    # 必須項目のチェック
    if not data or not data.get('name') or not data.get('date') or not data.get('location'):
        return jsonify({'error': 'Name, date, and location are required'}), 400

    try:
        # 日付文字列をdatetimeオブジェクトに変換
        fes_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD.'}), 400

    new_festival = Festivals(name=data['name'], date=fes_date, location=data['location'])
    db.session.add(new_festival)
    db.session.commit()
    return jsonify(new_festival.to_dict()), 201

# --- Auth API ---

# POST /api/register : 新規ユーザー登録
@api_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

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
        token = jwt.encode({
            'user_id': user.id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24) # トークンの有効期限は24時間
        }, current_app.config['SECRET_KEY'], algorithm="HS256")

        # フロントエンドが期待する形式でレスポンスを返す
        return jsonify({
            "token": token,
            "user": { "id": user.id, "username": user.username }
        })

    return jsonify({'error': 'ユーザー名またはパスワードが正しくありません'}), 401