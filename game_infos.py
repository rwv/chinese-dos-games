import inspect
import json
import os
from collections import OrderedDict

root = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))

with open(os.path.join(root, 'games.json'), encoding='utf8') as f:
    content = f.read()
    game_infos_ordered = json.loads(content, object_pairs_hook=OrderedDict)
    game_infos = json.loads(content)


def update_json(ordered_dict):
    with open(os.path.join(root, 'games.json'), encoding='utf8', mode='w') as f:
        f.write(json.dumps(ordered_dict, indent=2, ensure_ascii=False))
