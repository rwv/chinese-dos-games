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
    for k, game in game_info["games"].items():
        data_store_folder = os.path.join(root, 'static', 'gamedata', k)
        if not os.path.isdir(data_store_folder):
            os.makedirs(data_store_folder)
        scripts_dict[k] = run_packager(os.path.join(root, 'games', game['gameFolder']),
                                       os.path.join(data_store_folder, 'game.data'))
    with open(os.path.join(root, 'scripts.json'), mode='w', encoding='utf8') as f:
        f.write(json.dumps(scripts_dict, ensure_ascii=False))


if __name__ == '__main__':
    main()
