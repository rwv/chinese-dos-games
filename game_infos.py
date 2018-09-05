import inspect
import json
import os

root = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))

with open(os.path.join(root, 'games.json'), encoding='utf8') as f:
    game_infos = json.loads(f.read())
