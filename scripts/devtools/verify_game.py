"""通过 Chrome DevTools Protocol 在真实浏览器中验证游戏启动.

启动栈: vite dev + flask backend + headless Chrome + CDP.
截图保存 PNG, 通过 PNG 字节大小判断游戏是否成功启动 (黑屏 196 字节,
文本菜单 0.5-2 KB, 真实游戏画面 5+ KB).

依赖: websocket-client (uv pip install websocket-client)
环境:
  - dev server: vite dev on :5173, flask on :5000 (vite proxies /api /files)
  - chrome: --remote-debugging-port=9222 --remote-allow-origins=*

用法:
  python3 scripts/devtools/verify_game.py [游戏名] [截图输出] [等待秒数]

示例:
  python3 scripts/devtools/verify_game.py 绝地风暴 /tmp/kknd.png 18
  python3 scripts/devtools/verify_game.py 仙剑奇侠传  # emularity
"""
import argparse
import base64
import json
import os
import sys
import time
from pathlib import Path
from urllib.error import URLError
from urllib.request import urlopen

import websocket  # type: ignore


def find_chrome_tab(cdp_url: str = "http://localhost:9222", retries: int = 10) -> str:
    """从 CDP HTTP endpoint 找 page tab 的 WebSocket URL."""
    for _ in range(retries):
        try:
            tabs = json.loads(urlopen(cdp_url + "/json", timeout=2).read())
            for t in tabs:
                if t.get("type") == "page":
                    return t["webSocketDebuggerUrl"]
        except (URLError, ConnectionError, OSError):
            time.sleep(0.5)
    raise RuntimeError(f"no Chrome page tab at {cdp_url} after {retries} retries")


def interpret_screenshot(path: Path) -> str:
    """根据 PNG 字节大小给出人类可读的状态判断."""
    if not path.exists():
        return "MISSING"
    size = path.stat().st_size
    if size < 300:
        return f"BLACKSCREEN ({size} B)"
    if size < 1000:
        return f"text/early-boot ({size} B)"
    if size < 3000:
        return f"menus/loading ({size} B)"
    return f"real-game-screen ({size} B)"


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("game", nargs="?", default="绝地风暴", help="游戏名 (URL slug)")
    p.add_argument("output", nargs="?", default="/tmp/verify_game.png", help="截图保存路径")
    p.add_argument("wait", nargs="?", type=int, default=18, help="游戏加载等待秒数")
    p.add_argument("--cdp-url", default="http://localhost:9222", help="Chrome CDP 端口")
    p.add_argument(
        "--engine",
        choices=("js-dos", "emularity", "auto"),
        default="js-dos",
        help="选择引擎 (js-dos = DOSBox-X wasm, emularity = dosbox 0.74-3)",
    )
    p.add_argument(
        "--url",
        default="http://localhost:5173",
        help="前端 dev server base URL",
    )
    args = p.parse_args()

    print(f"[load] {args.game} -> {args.url}/games/{args.game}")
    ws = websocket.create_connection(find_chrome_tab(args.cdp_url))
    msg_id = 0

    def send(method: str, params: dict | None = None) -> dict:
        nonlocal msg_id
        msg_id += 1
        ws.send(json.dumps({"id": msg_id, "method": method, "params": params or {}}))
        while True:
            r = json.loads(ws.recv())
            if r.get("id") == msg_id:
                return r.get("result", {})

    def evj(expr: str):
        return send("Runtime.evaluate", {"expression": expr, "returnByValue": True, "awaitPromise": True})

    send("Page.enable")
    send("Page.navigate", {"url": f"{args.url}/games/{args.game}"})
    time.sleep(6)  # 等 React + API fetch + js-dos 启动 WASM

    # 选引擎
    if args.engine != "auto":
        result = evj(
            "(() => {"
            f"  const want = {json.dumps(args.engine)};"
            "  const btns = Array.from(document.querySelectorAll('button'));"
            "  const b = btns.find(x => x.textContent && x.textContent.includes(want));"
            "  if (b) { b.click(); return 'clicked ' + want; }"
            "  return 'not found';"
            "})()"
        )
        print(f"[engine] {result.get('result', {}).get('value')}")
    else:
        print("[engine] auto (per-game default applied)")
    time.sleep(3)

    # 等待游戏加载 (js-dos 启动慢: WASM 编译 + ISO 下载)
    print(f"[wait] {args.wait}s for game to boot...")
    last_summary = ""
    for s in range(args.wait):
        time.sleep(1)
        if s % 5 == 4:
            status = evj(
                "(() => {"
                "  const c = document.querySelector('canvas');"
                "  return JSON.stringify({"
                "    canvas: !!c,"
                "    snippet: document.body.innerText.slice(0, 80).replace(/\\n/g, ' ')"
                "  });"
                "})()"
            )
            last_summary = status.get("result", {}).get("value", "")
            print(f"  [{s+1}s] {last_summary}")

    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    data = send("Page.captureScreenshot", {"format": "png"})
    out.write_bytes(base64.b64decode(data["data"]))
    print(f"[screenshot] {out} ({len(data['data'])} b64 chars)")
    print(f"[result] {interpret_screenshot(out)}")

    # 收集错误信息
    errs = evj(
        "(() => {"
        "  const errs = Array.from(document.querySelectorAll('p')).map(p => p.textContent)"
        "    .filter(t => t && /error|missing|fail|please/i.test(t));"
        "  return JSON.stringify(errs.slice(0, 3));"
        "})()"
    )
    print(f"[page-errors] {errs.get('result', {}).get('value')}")
    ws.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
