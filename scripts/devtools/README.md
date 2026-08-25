# DevTools — 游戏验证工具

启动一个真实浏览器/模拟器, 确认游戏在 dosbox 0.74-3 / js-dos 8 下能跑出画面.

## verify_game.py — 浏览器 (推荐)

用 Chrome headless + CDP 打开游戏页, 选引擎, 等加载, 截图. 字节数 = 状态:
- `< 300 B`  → 黑屏 (游戏没起来 / 报错)
- `0.3-1 KB` → DOS 文本/早期启动
- `1-3 KB`  → 菜单/loading
- `3+ KB`   → 真实游戏画面 (16-color 4-bit 模式)

**前置**:
- `uv pip install --python /tmp/cdp/bin/python websocket-client`
- Google Chrome 151+: `google-chrome --headless --disable-gpu --no-sandbox --remote-debugging-port=9222 --remote-allow-origins='*' --user-data-dir=/tmp/cd-data about:blank &`
- vite + flask dev 跑着 (frontend 5173 代理 backend 5000)

**用法**:
```bash
python3 scripts/devtools/verify_game.py "绝地风暴" /tmp/kknd.png 18
python3 scripts/devtools/verify_game.py "仙剑奇侠传"  # 默认 emularity
python3 scripts/devtools/verify_game.py "侠客英雄传3" /tmp/x.png 20 --engine js-dos
```

## run_dosbox.sh — 命令行 (快)

无浏览器: 直接跑 dosbox + Xvfb + import. 比浏览器验证快 10x, 但看不到错误信息.

**前置**: `dosbox` (或 `guix shell dosbox -- dosbox`), `Xvfb` (`xorg-server`), `imagemagick`

**用法**:
```bash
./scripts/devtools/run_dosbox.sh "绝地风暴" --wait=15
./scripts/devtools/run_dosbox.sh "仙剑奇侠传" --out=/tmp/x.png
```

## 批量回归 (CI 用)

```bash
for g in 绝地风暴 孤胆枪手 凯兰蒂亚传奇2 剑侠情缘; do
    ./scripts/devtools/run_dosbox.sh "$g" --wait=20 --out=/tmp/ci-$$.png
done
```

输出形如 `绝地风暴: /tmp/x.png 5452 bytes (real-game)` 可被 awk 解析判断.

## 与 check_games.py 的区别

| 工具 | 检查什么 | 何时跑 |
|---|---|---|
| `check_games.py` | games.json 与 bin/ 的字段一致性 (静态) | 每次 commit 跑 |
| `verify_game.py` | 游戏在浏览器中实际能跑 (动态) | 改 dosboxArgs 后跑 |
| `run_dosbox.sh` | 游戏在 dosbox CLI 中能跑 (动态) | CI / 大量回归 |

## 常见坑

- **CDP 403 Forbidden**: Chrome 151+ 必须加 `--remote-allow-origins='*'`
- **Flask dev single-thread**: 长连接会卡死, 启动后用 `threaded=True` 或加 Gunicorn
- **Playwright 抢占 chrome**: 同一环境跑 playwright 会 spawn chrome 抢端口, 先 `pkill -9 -f google-chrome`
- **PNG 不可读**: vision API (`vision_inspect`) 在这环境不可用, 看 PNG 字节大小判断状态
- **DOSBox 黑屏 196 字节**: 之前依赖 cycles=auto; 1990s DOS/4GW 游戏需 `cycles=max`
