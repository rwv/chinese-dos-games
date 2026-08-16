# Frontend (React + Vite)

中文 DOS 游戏网站前端，基于 React + Vite + TypeScript + Tailwind CSS + React Router。

## 开发

确保后端已启动（`backend/app.py`，端口 5000），然后：

```sh
bun install
bun run dev
```

开发服务器启动在 `http://localhost:5173`，API 请求通过 Vite 代理转发到后端。

`dev` 和 `build` 会先把 `js-dos` 的浏览器运行时同步到 `public/js-dos/`。该目录是生成目录，不提交版本控制。

## 模拟器

游戏页目前提供两种引擎：

- `emularity`：现有稳定引擎，默认使用
- `js-dos 8`：迁移试用引擎，自托管 DOSBox WASM，支持软键盘、手柄、光盘镜像和文件系统持久化

js-dos 会每 30 秒保存一次文件系统变更，也可以点击“保存进度”立即保存。存档按游戏标识符保存在浏览器 IndexedDB 中。

## 构建

```sh
bun run build
```

产物在 `dist/`，为静态文件，可由任意 Web 服务器托管。部署时需配置 `/api`、`/files`、`/static` 路径指向后端。
