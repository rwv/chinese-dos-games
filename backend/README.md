# Backend (Flask API)

中文 DOS 游戏网站的 API 后端，提供 JSON 接口和静态文件代理。

## 安装依赖

```sh
pip install -r requirements.txt
```

## 运行

在 `backend/` 目录下执行：

```sh
python app.py
```

服务启动在 `http://localhost:5000`。

## API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/games` | 全部游戏列表，返回 `{count, games[]}` |
| GET | `/api/games/<identifier>` | 单个游戏详情，不存在返回 404 |
| GET | `/api/search?q=<关键词>` | 按中文名搜索，返回 `{count, games[]}` |
| GET | `/files/bin/<identifier>.zip` | 游戏文件 |
| GET | `/files/img/<identifier>/<coverFilename>` | 封面图 |

`identifier` 含中文字符，请求时需 URL 编码。

## 静态资源

`static/emularity/` 下的 DOSBox 模拟器运行时文件由 Flask static 直接提供，前端通过 `/static/emularity/...` 路径引用（开发时通过 Vite 代理）。
