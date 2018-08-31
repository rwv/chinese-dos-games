import inspect
import json
import os

from packager import run_packager


def main():
    root = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))
    info_file = os.path.join(root, 'games.json')

    with open(info_file, encoding='utf8') as f:
        game_info = json.loads(f.read())

    scripts_dict = dict()
    for k, v in game_info["games"].items():
        scripts_dict[k] = run_packager(os.path.join(root, 'games', 'XianJianQiXiaZhuan'),
                                       os.path.join(root, 'static', 'gamedata', k, 'game.data'))
    with open(os.path.join(root, 'scripts.json'), mode='w', encoding='utf8') as f:
        f.write(json.dumps(scripts_dict, ensure_ascii=False))


if __name__ == '__main__':
    main()
