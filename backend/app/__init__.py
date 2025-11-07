from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt
from flask_cors import CORS


db = SQLAlchemy()
migrate = Migrate()
bcrypt = Bcrypt()

def create_app():
    """Application-factory function"""
    app = Flask(__name__, instance_relative_config=True)

    # 設定の読み込み
    app.config.from_mapping(
        SQLALCHEMY_DATABASE_URI='sqlite:///fesData.db',
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        # JWTの署名に使う秘密鍵。本番環境ではより複雑なキーに変更してください。
        SECRET_KEY='your-very-secret-and-secure-key'
    )

    # 拡張機能の初期化
    db.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)
    # flask-corsを初期化し、アプリケーション全体に適用
    CORS(
        app,
        resources={r"/api/*": {"origins": "http://localhost:3000"}},
        supports_credentials=True
    )

    with app.app_context():
        from . import api_routes
        app.register_blueprint(api_routes.api_bp)

        db.create_all()

    return app