from flask import Flask
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def create_app():
    """Application-factory function"""
    app = Flask(__name__, instance_relative_config=True)

    # 設定の読み込み
    app.config.from_mapping(
        SQLALCHEMY_DATABASE_URI='sqlite:///fesData.db',
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
    )

    # 拡張機能の初期化
    db.init_app(app)

    with app.app_context():
        from . import routes
        db.create_all()

    return app