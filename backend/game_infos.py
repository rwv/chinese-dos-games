import json
import os

# backend/ 在仓库根目录下，games.json 位于上级目录
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

with open(os.path.join(ROOT, 'games.json'), encoding='utf8') as f:
    game_infos = json.load(f)

game_infos_with_cover = [
    info for info in game_infos['games'].values()
    if 'coverFilename' in info
]
