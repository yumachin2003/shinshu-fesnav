from flask import Blueprint, request, jsonify
from .models import Item
from . import db

# 'api'という名前でBlueprintを作成
api_bp = Blueprint('api', __name__, url_prefix='/api')

# GET /api/items : 全てのアイテムを取得するためのAPI
@api_bp.route('/items', methods=['GET'])
def get_items():
    items = Item.query.all()
    # 取得したアイテムのリストをJSON形式で返す
    return jsonify([item.to_dict() for item in items])

# POST /api/items : 新しいアイテムを追加するためのAPI
@api_bp.route('/items', methods=['POST'])
def add_item():
    # Reactから送られてきたJSONデータを取得
    data = request.get_json()
    
    if not data or 'name' not in data or not data['name'].strip():
        return jsonify({'error': 'Item name is required'}), 400
    
    new_item = Item(name=data['name'])
    db.session.add(new_item)
    db.session.commit()
    
    return jsonify(new_item.to_dict()), 201