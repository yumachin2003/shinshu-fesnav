from flask import Flask, jsonify
from flask_cors import CORS
import sqlite3

app = Flask(__name__)
# CORSを有効にすることで、React（別のポートで動く）からのアクセスを許可
CORS(app) 

# /api/festivals にアクセスが来たら、この関数が実行される
@app.route('/api/festivals', methods=['GET'])
def get_all_festivals():
    conn = None
    try:
        # データベースに接続
        conn = sqlite3.connect('matsuri.db')
        conn.row_factory = sqlite3.Row  # 結果を辞書形式で取得できるように設定
        cursor = conn.cursor()
        
        # データの取得
        cursor.execute('SELECT name, date, location, access, attendees FROM festivals')
        festivals_data = cursor.fetchall()
        
        # 取得したデータをJSON形式に変換
        festivals_list = [dict(row) for row in festivals_data]
        
        # JSONレスポンスとして返す
        return jsonify(festivals_list)

    except Exception as e:
        print(f"エラーが発生しました: {e}")
        return jsonify({'error': 'データベースエラー'}), 500
    finally:
        if conn:
            conn.close()

# アプリケーションの実行
if __name__ == '__main__':
    # 開発中はデバッグモードで実行
    app.run(debug=True, port=5000)