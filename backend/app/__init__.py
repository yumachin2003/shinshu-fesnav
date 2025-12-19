import os
from flask import Flask, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from dotenv import load_dotenv

# .env を読み込む
load_dotenv()

db = SQLAlchemy()
migrate = Migrate()
bcrypt = Bcrypt()

def create_app():
    """Application-factory function"""

    is_production = os.getenv("FLASK_ENV") != "development"

    # 本番環境ではReactのビルドフォルダを静的フォルダとして指定
    app_kwargs = {
        "instance_relative_config": True,
    }
    if is_production:
        app_kwargs['static_folder'] = os.getenv('STATIC_FOLDER', '../../frontend/build')

    app = Flask(__name__, **app_kwargs)

    # --- ✅ Basic Config（ここが重要） ---
    app.config.from_mapping(
        SQLALCHEMY_DATABASE_URI=os.getenv("DATABASE_URL", "sqlite:///fesData.db"),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,

        SECRET_KEY=os.getenv("SECRET_KEY"),

        # Google
        GOOGLE_CLIENT_ID=os.getenv("REACT_APP_GOOGLE_CLIENT_ID"),
        GOOGLE_CLIENT_SECRET=os.getenv("REACT_APP_GOOGLE_CLIENT_SECRET"),
        GOOGLE_REDIRECT_URI=os.getenv("REACT_APP_GOOGLE_REDIRECT_URI"),

        # LINE ★追加
        LINE_CHANNEL_ID=os.getenv("REACT_APP_LINE_CHANNEL_ID"),
        LINE_CHANNEL_SECRET=os.getenv("REACT_APP_LINE_CHANNEL_SECRET"),
        LINE_REDIRECT_URI=os.getenv("REACT_APP_LINE_REDIRECT_URI"),

        FRONTEND_URL=os.getenv("FRONTEND_URL"),
    )

    # --- Extensions Init ---
    db.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)

    if not is_production:
        # 開発用に /api/* すべてのオリジンとメソッドを許可
        CORS(
            app,
            resources={r"/api/*": {"origins": "*"}},  # localhost:3000 以外も許可
            supports_credentials=True,
            allow_headers=["Content-Type", "Authorization"],
            methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],  # PATCH も追加
        )

    with app.app_context():
        from . import api_routes
        from . import auth_routes

        app.register_blueprint(api_routes.api_bp)
        app.register_blueprint(auth_routes.auth_bp, url_prefix="/api/auth")

        if is_production:
            # == Production Mode (1 Port) ==
            @app.route("/", defaults={"path": ""})
            @app.route("/<path:path>")
            def serve_react_app(path):
                if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
                    return send_from_directory(app.static_folder, path)
                else:
                    return send_from_directory(app.static_folder, "index.html")

        # --- DB Creation ---
        db.create_all()


    return app