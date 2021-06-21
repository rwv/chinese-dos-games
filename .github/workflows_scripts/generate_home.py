import json

import os
import json

root = os.path.abspath('.')

EXIST_TEXT = '✔️'
NONEXIST_TEXT = '❌'

with open(os.path.join(root, 'games.json'), encoding='utf8') as f:
    game_infos = json.load(f)

home_text = f"""
# 🎮 中文 DOS 游戏

中文 DOS 游戏合集，目前共有 {len(game_infos['games'].keys())} 款游戏。

## 信息统计

"""

# Generate Table


def sizeof_fmt(num, suffix='B'):
    for unit in ['', 'Ki', 'Mi', 'Gi', 'Ti', 'Pi', 'Ei', 'Zi']:
        if abs(num) < 1024.0:
            return "%3.1f%s%s" % (num, unit, suffix)
        num /= 1024.0
    return "%.1f%s%s" % (num, 'Yi', suffix)


handler = {
    '游戏名称': lambda game_info: f'<a href="https://dos.zczc.cz/games/{identifier}/">' +
    game_info['name']['zh-Hans']+'</a>',
    '文件大小': lambda game_info: sizeof_fmt(game_info['filesize']),
    '封面': lambda game_info: EXIST_TEXT if 'coverFilename' in game_info.keys() else NONEXIST_TEXT,
    '键位': lambda game_info: EXIST_TEXT if 'keymaps' in game_info.keys() else NONEXIST_TEXT,
    '作弊': lambda game_info: EXIST_TEXT if 'cheats' in game_info.keys() else NONEXIST_TEXT,
    '发行年份': lambda game_info: EXIST_TEXT if 'releaseYear' in game_info.keys() else NONEXIST_TEXT,
    '类型': lambda game_info: EXIST_TEXT if 'type' in game_info.keys() else NONEXIST_TEXT,
}

table_header = '| ' + ' | '.join(handler.keys()) + ' |\n'
table_header = table_header + '| :----:' * len(handler.keys()) + ' |\n'
table_text = table_header

for identifier, game_info in game_infos['games'].items():
    row = '| ' + \
        ' | '.join(map(lambda func: func(game_info),
                       handler.values())) + ' |\n'
    table_text += row


home_text += table_text


os.makedirs(os.path.join(root, 'wiki'))
with open(os.path.join(root, 'wiki', 'Home.md'), mode='w', encoding='utf8') as f:
    f.write(home_text)
