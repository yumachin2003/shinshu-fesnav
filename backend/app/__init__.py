from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS

db = SQLAlchemy()
migrate = Migrate()

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
    migrate.init_app(app, db)

    with app.app_context():
        from . import routes
        from . import api_routes
        app.register_blueprint(routes.main_bp)
        app.register_blueprint(api_routes.api_bp)
        
        # APIルートに対してCORSを有効にする
        CORS(app, resources={r"/api/*": {"origins": "*"}})

        db.create_all()

    return app