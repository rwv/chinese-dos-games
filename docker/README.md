# Docker build 与运行
# 注: bin/ 36GB, 推荐挂载 volume 而非 COPY 到镜像 (镜像含 bin 会很大)

# 1. 基础构建 (含 bin/)
docker build -t chinese-dos-games:dev .

# 2. 运行时挂载 bin/ 和 games.json (不打包进镜像, 镜像 < 500MB)
docker run -d \
  -p 8080:80 \
  -v /path/to/bin:/app/bin:ro \
  -v /path/to/games.json:/app/games.json:ro \
  -e NGINX_PORT=80 \
  --name dosgames \
  chinese-dos-games:dev

# 3. 健康检查
curl http://localhost:8080/api/games | head -c 200

# 4. Kubernetes 部署 (示例)
# - PVC 挂载 /app/bin (ReadOnlyMany)
# - ConfigMap 挂载 /app/games.json
# - Service: ClusterIP
# - Ingress: nginx-ingress, 配 COOP/COEP 不冲突
