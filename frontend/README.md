# Frontend (React + Vite)

中文 DOS 游戏网站前端，基于 React + Vite + TypeScript + Tailwind CSS + React Router。

## 开发

确保后端已启动（`backend/app.py`，端口 5000），然后：

```sh
bun install
bun run dev
```

开发服务器启动在 `http://localhost:5173`，API 请求通过 Vite 代理转发到后端。

## 构建

```sh
bun run build
```

产物在 `dist/`，为静态文件，可由任意 Web 服务器托管。部署时需配置 `/api`、`/files`、`/static` 路径指向后端。
