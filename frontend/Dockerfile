### ステージ1: ビルド環境 ###
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

### ステージ2: 本番環境 ###
FROM nginxinc/nginx-unprivileged:1.25-alpine

# rootユーザーに切り替えて証明書ディレクトリの作成とコピーを行う
USER root
RUN mkdir -p /etc/nginx/certs

# 証明書の所有者をnginxユーザー(UID 101)に変更して読み取れるようにする
RUN chown -R 101:101 /etc/nginx/certs

# 一般ユーザー(nginx)に戻る
USER 101

# ビルド成果物と設定ファイルをコピー
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# ポート5051を公開
EXPOSE 5051

CMD ["nginx", "-g", "daemon off;"]
