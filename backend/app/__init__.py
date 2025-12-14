import os
from flask import Flask, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()   # ← 追加

db = SQLAlchemy()
migrate = Migrate()
bcrypt = Bcrypt()

def create_app():
    """Application-factory function"""

    is_production = os.getenv('FLASK_ENV') != 'development'
    
    # 本番環境ではReactのビルドフォルダを静的フォルダとして指定
    app_kwargs = {
        'instance_relative_config': True,
    }
    if is_production:
        app_kwargs['static_folder'] = os.getenv('STATIC_FOLDER', '../../frontend/build')

    app = Flask(__name__, **app_kwargs)

    # --- Basic Config ---
    app.config.from_mapping(
        SQLALCHEMY_DATABASE_URI='sqlite:///fesData.db',
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        # JWTの署名に使う秘密鍵。本番環境ではより複雑なキーに変更してください。
        SECRET_KEY='your-very-secret-and-secure-key',

        # ★ Google OAuth 設定読み込み
        GOOGLE_CLIENT_ID=os.getenv("GOOGLE_CLIENT_ID"),
        GOOGLE_CLIENT_SECRET=os.getenv("GOOGLE_CLIENT_SECRET"),
        GOOGLE_REDIRECT_URI=os.getenv("GOOGLE_REDIRECT_URI"),
    )
    

    # --- Extensions Init ---
    db.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)

    if not is_production:
        # == Development Mode (2 Ports) ==
        # React dev server (localhost:3000)からのAPIリクエストを許可
        CORS(
            app,
            resources={r"/api/*": {"origins": "http://localhost:3000"}},
            supports_credentials=True,
            allow_headers=["Content-Type", "Authorization"],
            methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
        )

    with app.app_context():
        # --- Blueprint Registration ---
        from . import api_routes
        app.register_blueprint(api_routes.api_bp)

        if is_production:
            # == Production Mode (1 Port) ==
            # API以外のリクエストをすべてReactアプリに流すためのルート
            @app.route('/', defaults={'path': ''})
            @app.route('/<path:path>')
            def serve_react_app(path):
                if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
                    return send_from_directory(app.static_folder, path)
                else:
                    return send_from_directory(app.static_folder, 'index.html')

        # --- DB Creation ---
        db.create_all()

    return app