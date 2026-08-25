# 多阶段构建: 前端 build -> nginx 服务, backend Flask + games/bin
# 用 python 3.12-slim (bookworm) 避免 alpine musl 兼容问题

# ========== 阶段 1: 前端 ==========
FROM node:20-slim AS frontend-build

WORKDIR /app/frontend

# bun 跑 sync-js-dos (拷贝 emulators 文件) + 依赖
COPY frontend/package.json frontend/bun.lock ./
# 直接装 bun (corepack 1.3.14 不识别)
RUN npm install -g bun@1.1.34 && \
    bun install --frozen-lockfile

COPY frontend/ ./
# build 产物到 dist/
RUN bun run sync:js-dos && \
    bun run build

# ========== 阶段 2: backend + 整合 ==========
FROM python:3.12-slim AS backend

# gunicorn 服务 Flask
RUN pip install --no-cache-dir gunicorn==22.0.0 flask==3.0.3

WORKDIR /app

# 拷贝 backend
COPY backend/ /app/backend/

# 拷贝前端 build 产物 -> nginx 服务
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

# games.json 放应用目录 (可挂载覆盖)
COPY games.json /app/games.json

# bin/ 放应用目录 (可挂载覆盖, 通常用 volume)
COPY --chown=nobody:nogroup bin-empty/ /app/bin/

# 拷贝 nginx 配置
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# nginx + gunicorn
RUN apt-get update && \
    apt-get install -y --no-install-recommends nginx && \
    rm -rf /var/lib/apt/lists/* && \
    rm /etc/nginx/sites-enabled/default

# 启动脚本
COPY docker/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

WORKDIR /app/backend

# 环境变量 (用 docker run -e 覆盖)
ENV FLASK_APP=app.py \
    GUNICORN_WORKERS=2 \
    GUNICORN_TIMEOUT=120 \
    NGINX_PORT=80 \
    GAMES_DIR=/app/bin \
    GAMES_JSON=/app/games.json

EXPOSE 80

# 入口
ENTRYPOINT ["/app/entrypoint.sh"]
