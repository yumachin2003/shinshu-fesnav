import os
import sys
from flask import Flask, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from flask_mailman import Mail
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# 環境変数読み込み
load_dotenv(".env.local")
load_dotenv(".env", override=True)

db = SQLAlchemy()
migrate = Migrate()
bcrypt = Bcrypt()
mail = Mail()
limiter = Limiter(key_func=get_remote_address, default_limits=["200 per day", "50 per hour"], storage_uri="memory://")

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

    # --- Basic Config ---
    mysql_url = os.getenv("DATABASE_URL")

    # DATABASE_URLが設定されていない（または空の）場合、個別の環境変数から構築を試みる
    if not mysql_url:
        db_user = os.getenv("MYSQL_USER")
        db_password = os.getenv("MYSQL_PASSWORD")
        db_host = os.getenv("MYSQL_HOST")
        db_port = os.getenv("MYSQL_PORT")
        db_name = os.getenv("MYSQL_DATABASE")

        if db_user and db_password and db_host and db_name:
            mysql_url = f"mysql+pymysql://{db_user}:{db_password}@{db_host}:{db_port or 3306}/{db_name}"

    if not os.path.exists(app.instance_path):
        os.makedirs(app.instance_path)
    sqlite_url = f"sqlite:///{os.path.join(app.instance_path, 'fesData.db')}"

    # MySQLへの接続試行
    use_mysql = False
    if mysql_url:
        try:
            # タイムアウトを短めに設定して接続確認
            temp_engine = create_engine(mysql_url, connect_args={"connect_timeout": 100})

            with temp_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            use_mysql = True
        except Exception as e:
            # マイグレーションコマンド実行時（flask db ...）はSQLiteへのフォールバックを禁止してエラーにする
            if "db" in sys.argv or "sync-db" in sys.argv:
                app.logger.error(f"MySQL connection failed during migration or sync: {e}")
                if "1045" in str(e):
                    app.logger.error("Hint: Check your database password in .env or user permissions (GRANT). If the error mentions a specific IP (e.g. 172.17.0.1), you must GRANT access to 'root'@'<IP>'.")
                raise e
            app.logger.warning(f"MySQL connection failed: {e}. Falling back to SQLite.")

    app.config.from_mapping(
        SQLALCHEMY_DATABASE_URI=mysql_url if use_mysql else sqlite_url,
        SQLALCHEMY_TRACK_MODIFICATIONS=False,

        SECRET_KEY=os.getenv("SECRET_KEY"),
        SESSION_COOKIE_SAMESITE="Lax",
        SESSION_COOKIE_HTTPONLY=True,

        # Google
        GOOGLE_CLIENT_ID=os.getenv("REACT_APP_GOOGLE_CLIENT_ID"),
        GOOGLE_CLIENT_SECRET=os.getenv("REACT_APP_GOOGLE_CLIENT_SECRET"),
        GOOGLE_REDIRECT_URI=os.getenv("REACT_APP_GOOGLE_REDIRECT_URI"),

        # LINE
        LINE_CHANNEL_ID=os.getenv("REACT_APP_LINE_CHANNEL_ID"),
        LINE_CHANNEL_SECRET=os.getenv("REACT_APP_LINE_CHANNEL_SECRET"),
        LINE_REDIRECT_URI=os.getenv("REACT_APP_LINE_REDIRECT_URI"),

        BASE_URL=os.getenv("BASE_URL"),

        # Mail Settings
        MAIL_SERVER=os.getenv('MAIL_SERVER', 'smtp.gmail.com'),
        MAIL_PORT=int(os.getenv('MAIL_PORT', 587)),
        MAIL_USERNAME=os.getenv('MAIL_USERNAME'),
        MAIL_PASSWORD=os.getenv('MAIL_PASSWORD'),
        MAIL_USE_TLS=os.getenv('MAIL_USE_TLS', 'True') == 'True',
        MAIL_DEFAULT_SENDER=os.getenv('MAIL_DEFAULT_SENDER', 'noreply@example.com'),
    )

    # --- Extensions Init ---
    db.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)
    mail.init_app(app)
    limiter.init_app(app)

    # 外部DBや外部サーバー利用時は、フロントエンドからのクロスオリジンリクエストを常に許可する
    CORS(
        app,
        resources={r"/api/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}},
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    )

    with app.app_context():
        from . import api_routes
        from . import oauth
        from . import pw_reset

        app.register_blueprint(api_routes.api_bp)
        app.register_blueprint(oauth.oauth_bp, url_prefix="/api/auth")
        app.register_blueprint(pw_reset.pw_reset_bp)

        if is_production:
            # == Production Mode (1 Port) ==
            @app.route("/", defaults={"path": ""})
            @app.route("/<path:path>")
            def serve_react_app(path):
                if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
                    return send_from_directory(app.static_folder, path)
                else:
                    return send_from_directory(app.static_folder, "index.html")

    # --- カスタムコマンド: flask sync-db ---
    @app.cli.command("sync-db")
    def sync_db():
        """MySQLからローカルSQLiteへデータを同期する"""
        print("DATABASE_URL:", mysql_url)
        print("use_mysql:", use_mysql)
        if not use_mysql:
            print("エラー: DATABASE_URLが設定されていないか、MySQLに接続できません。")
            return

        try:
            from .models import Festivals, User, UserFavorite, EditLog, Review, InformationSubmission, Passkey
            sqlite_engine = create_engine(sqlite_url)
            
            print("SQLiteのスキーマを更新中...")
            db.metadata.create_all(sqlite_engine)

            # 同期するモデルのリスト
            models = [Festivals, User, UserFavorite, EditLog, Review, InformationSubmission, Passkey]
            
            with sqlite_engine.connect() as sqlite_conn:
                with sqlite_conn.begin():
                    for model in models:
                        print(f"同期中: {model.__tablename__}...")
                        items = model.query.all()
                        
                        # SQLite側の既存データを削除して入れ替え
                        sqlite_conn.execute(model.__table__.delete())
                        
                        data_to_sync = []
                        for item in items:
                            row = {c.name: getattr(item, c.name) for c in model.__table__.columns}
                            data_to_sync.append(row)
                        
                        if data_to_sync:
                            sqlite_conn.execute(model.__table__.insert(), data_to_sync)
            
            print("同期が完了しました！ instance/fesData.db が更新されました。")
        except Exception as e:
            print(f"同期失敗: {e}")

    # --- DB Initialization ---
    with app.app_context():
        # 現在のメインDB（MySQL or SQLite）のテーブルを作成
        # マイグレーション（Alembic）で管理するため、アプリ起動時の自動作成は無効化します
        # db.create_all()
        
        if use_mysql:
            # MySQL接続時はSQLite側のスキーマも最新にする（カラム不足エラー防止）
            sqlite_engine = create_engine(sqlite_url)
            db.metadata.create_all(sqlite_engine)

    return app