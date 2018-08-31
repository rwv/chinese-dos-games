import inspect
import json
import os

root = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))

with open(os.path.join(root, 'games.json'), encoding='utf8') as f:
    game_infos = json.loads(f.read())

with open(os.path.join(root, 'scripts.json'), encoding='utf8') as f:
    scripts = json.loads(f.read())

for k, v in game_infos['games'].items():
    game_infos['games'][k]['script'] = scripts[k]
