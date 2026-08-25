#!/bin/bash
# 启动 nginx (前端静态 + 反代 /api) + gunicorn (backend).
# bin/ 与 games.json 默认在镜像内, 但推荐挂载 volume 替换.

set -e

# 替换 nginx 配置中的占位符
sed -i "s|__BACKEND__|127.0.0.1:8000|g" /etc/nginx/conf.d/default.conf

# 启动 backend (gunicorn)
echo "[startup] gunicorn: ${GUNICORN_WORKERS} workers"
cd /app/backend
gunicorn --workers="${GUNICORN_WORKERS}" \
    --timeout="${GUNICORN_TIMEOUT}" \
    --bind=127.0.0.1:8000 \
    --access-logfile=- \
    --error-logfile=- \
    app:app &
BACKEND_PID=$!

# 启动 nginx (前台)
echo "[startup] nginx: port ${NGINX_PORT}"
exec nginx -g "daemon off;"
