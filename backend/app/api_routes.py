from flask import Blueprint, request, jsonify
from .models import Festivals
from datetime import datetime
from . import db

# 'api'という名前でBlueprintを作成
api_bp = Blueprint('api', __name__, url_prefix='/api')

# --- Festival API ---

# GET /api/festivals : 全てのお祭りを取得
@api_bp.route('/festivals', methods=['GET'])
def get_festivals():
    festivals = Festivals.query.all()
    return jsonify([f.to_dict() for f in festivals])

# POST /api/festivals : 新しいお祭りを追加
@api_bp.route('/festivals', methods=['POST'])
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