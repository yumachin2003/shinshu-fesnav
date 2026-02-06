FROM python:3.13-slim

# Nginx, gcc, python3-dev等をインストール
RUN apt-get update && apt-get install -y \
    nginx \
    gettext-base \
    gcc \
    python3-dev \
    libffi-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# SIF実行時（非ルートユーザー）でも動作するように権限を調整
RUN chmod -R 777 /var/log/nginx /var/lib/nginx /run

WORKDIR /app

RUN pip install pipenv
COPY Pipfile Pipfile.lock ./
RUN pipenv install --system --deploy

COPY . .

# マウント用のディレクトリを作成しておく
RUN mkdir -p /usr/share/nginx/html /etc/nginx/certs

# 公開ポートを5051に変更（非特権ポート）
EXPOSE 5051

# 起動時に環境変数を展開してNginx設定を生成し、NginxとGunicornを起動
# $PORT などの変数を Nginx 設定テンプレートに流し込みます
CMD export PORT=${PORT:-5051} && \
    export SERVER_NAME=${SERVER_NAME:-localhost} && \
    export GUNICORN_PORT=${GUNICORN_PORT:-5052} && \
    envsubst '$PORT $SERVER_NAME $GUNICORN_PORT' < /app/nginx.conf > /etc/nginx/sites-enabled/default && \
    nginx && \
    exec gunicorn --bind 127.0.0.1:${GUNICORN_PORT} --workers 4 "app:create_app()"
