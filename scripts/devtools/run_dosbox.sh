#!/usr/bin/env bash
# 本地 dosbox 验证游戏启动 (无浏览器, 仅命令行 + Xvfb).
#
# 用于 games.json 修改后的快速回归测试, 适合在 CI 跑或批量跑全部游戏.
# 浏览器验证用 verify_game.py (更真实但需 Chrome headless).
#
# 用法:
#   ./scripts/devtools/run_dosbox.sh <游戏名> [--wait=秒数] [--out=PNG]
#
# 输出:
#   - 200-1000 字节 PNG = 黑屏/早期启动
#   - 1000-3000 字节 = 文本菜单/loading
#   - 3000+ 字节 = 真实游戏画面
#
# 依赖: guix shell dosbox xorg-server imagemagick
#       (即 nix-style 安装, 或在 Mac 上 brew install dosbox xquartz)

set -e

game="$1"
shift || { echo "usage: $0 <游戏名> [--wait=20] [--out=/tmp/x.png]" >&2; exit 2; }

wait=20
out="/tmp/dosbox-verify-$$.png"
work="/tmp/dosbox-verify-$$"
zip="bin/${game}.zip"

while [ $# -gt 0 ]; do
    case "$1" in
        --wait=*) wait="${1#--wait=}";;
        --out=*)  out="${1#--out=}";;
        *) echo "unknown arg: $1" >&2; exit 2;;
    esac
    shift
done

if [ ! -f "$zip" ]; then
    echo "no such game: $game (zip $zip not found)" >&2
    exit 1
fi

# 准备临时工作目录
rm -rf "$work"; mkdir -p "$work"
unzip -o "$zip" -d "$work" >/dev/null

# 读 games.json 配置
exe=$(python3 -c "import json; print(json.load(open('games.json'))['games'].get('$game', {}).get('executable', ''))")
cdimg=$(python3 -c "import json; print(json.load(open('games.json'))['games'].get('$game', {}).get('cdImage') or '')")
memsize=$(python3 -c "import json; print(json.load(open('games.json'))['games'].get('$game', {}).get('memsize', '') or '16')")
if [ -z "$exe" ]; then echo "no executable for $game" >&2; exit 1; fi

# 写 dosbox conf
cat > "$work/dosbox.conf" <<EOF
[sdl]
output=surface
[dosbox]
machine=svga_s3
memsize=$memsize
[cpu]
core=auto
cycles=max
[dos]
xms=true
ems=true
umb=true
[autoexec]
echo off
mount c .
c:
EOF

# cdImage 处理
if [ -n "$cdimg" ] && [ -f "$work/$cdimg" ]; then
    echo "imgmount d \"$work/$cdimg\" -t iso" >> "$work/dosbox.conf"
fi
# dosboxArgs 处理 (除 cycles 之外的)
python3 -c "
import json
g = json.load(open('games.json'))['games'].get('$game', {})
da = g.get('dosboxArgs') or []
for a in da[1::2]:
    if 'cycles' not in a:
        print(a)
" >> "$work/dosbox.conf"

echo "$exe" >> "$work/dosbox.conf"

# 跑 (使用 guix shell 在没有系统 dosbox 的环境, Xvfb/import 都在 shell 里)
if command -v dosbox >/dev/null 2>&1 && command -v Xvfb >/dev/null 2>&1; then
    # 本地全装, 直接用
    DOSBOX=dosbox
elif command -v guix >/dev/null 2>&1; then
    # 用 guix shell 一次性拿到 dosbox + xorg + imagemagick
    DOSBOX="guix shell dosbox xorg-server imagemagick -- dosbox"
elif command -v nix-shell >/dev/null 2>&1; then
    DOSBOX="nix-shell -p dosbox xorg imagemagick --run dosbox"
else
    echo "dosbox + Xvfb + imagemagick not found" >&2
    exit 1
fi

export SDL_VIDEODRIVER=x11 DISPLAY=:99
# guix shell 模式: Xvfb/import 都在 shell 路径里; 否则 PATH 已经有
if [[ "$DOSBOX" == "dosbox" ]]; then
    Xvfb :99 -screen 0 800x600x24 >/dev/null 2>&1 &
    XV=$!
    sleep 1
    cd "$work"
    "$DOSBOX" -conf dosbox.conf >/dev/null 2>&1 &
    DB=$!
    sleep "$wait"
    import -window root "$out" 2>/dev/null || true
    kill $DB 2>/dev/null
    kill $XV 2>/dev/null
    wait 2>/dev/null
else
    cd "$work"
    bash -c "Xvfb :99 -screen 0 800x600x24 >/dev/null 2>&1 & XV=\$!
sleep 1
$DOSBOX -conf dosbox.conf >/dev/null 2>&1 &
DB=\$!
sleep $wait
import -window root $out 2>/dev/null || true
kill \$DB \$XV 2>/dev/null
wait 2>/dev/null
"
fi

# 判断
size=$(stat -c %s "$out" 2>/dev/null || echo 0)
if [ "$size" -lt 300 ]; then
    status="BLACKSCREEN"
elif [ "$size" -lt 1000 ]; then
    status="text/early"
elif [ "$size" -lt 3000 ]; then
    status="menu/loading"
else
    status="real-game"
fi
echo "$game: $out $size bytes ($status)"
