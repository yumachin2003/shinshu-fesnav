FROM python:3.13-slim

# Nginxのインストール
RUN apt-get update && apt-get install -y nginx && rm -rf /var/lib/apt/lists/*

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

# Nginxを起動（デフォルトでバックグラウンド）し、Gunicornをフォアグラウンドで実行
CMD nginx && exec gunicorn --bind 127.0.0.1:5052 --workers 4 "app:create_app()"
