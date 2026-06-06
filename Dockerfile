# ベースイメージを指定
FROM node:20-bullseye-slim

# OSパッケージを更新（Debian系）
RUN apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Viteの開発サーバー用ポートを公開
EXPOSE 5173

# ホストとのファイル同期を安定させるための設定
ENV CHOKIDAR_USEPOLLING=true

# 依存関係をビルド時にインストール（devDependencies を含む）
# package-lock.json があれば npm ci を使い、無ければ npm install を実行
COPY package*.json ./
# Install dependencies. Use `npm install` to avoid CI failing when lockfile
# is out of sync with package.json (we don't modify lockfile in the repo here).
RUN npm install --no-audit --no-fund

# アプリケーションコードをコピー
COPY . .