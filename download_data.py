import hashlib
import json
# import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import quote, urljoin
from urllib.request import urlretrieve

ROOT = Path(__name__).resolve().parent
BASE = 'https://dos.zczc.cz/static/games/bin/'
DESTINATION = ROOT.joinpath('bin')
BUF_SIZE = 65535
# WORKERS = len(os.sched_getaffinity(0)) * 2 + 1
WORKERS = 5


def generate_sha256(file, buffer_size=BUF_SIZE):
    """
    generate file's sha256 checksum

    :param file: file's location
    :return: sha256 string
    """
    sha256 = hashlib.sha256()
    with open(file, 'rb') as f:
        while True:
            data = f.read(buffer_size)
            if data:
                sha256.update(data)
            else:
                break
    return sha256.hexdigest()


def check_integrity(game_info, name, location):
    result = location.is_file() and generate_sha256(location) == game_info['games'][name]['sha256']
    return result, name, location


def download(url, game_name, to):
    game_name_ = Path(game_name).with_suffix('.zip')
    from_ = urljoin(url, quote(str(game_name_)))
    urlretrieve(from_, to)
    return game_name


def main(url_root, destination, game_info, workers):
    """
    check game archives whether exists and their checksum, download from target.

    :return: the list of downloaded file
    """
    if not destination.is_dir():
        destination.mkdir()

    game_name_locations = set((name, destination.joinpath(name).with_suffix('.zip'))
                              for name in game_info['games'])

    total_count = len(game_name_locations)
    print(f'Checking integrity for {total_count} games')
    skipped_games = set()
    with ThreadPoolExecutor(max_workers=workers) as executor:
        tasks = [executor.submit(check_integrity, game_info, name, location)
                 for name, location in game_name_locations]
        for count, result in enumerate(as_completed(tasks), start=2):
            percent = (count / total_count) * 100
            sys.stdout.write('\r%(percent).2f%%' % {'percent': percent})
            sys.stdout.flush()
            is_in_good_piece, name, location = result.result()
            if is_in_good_piece:
                skipped_games.add((name, location))
    print('')
    if skipped_games:
        skipped_games_count = len(skipped_games)
        print(f'{skipped_games_count} games are good')

    games_to_download = game_name_locations - skipped_games
    if games_to_download:
        total_download_count = len(games_to_download)
        print(f'Downloading {total_download_count} games')
    with ThreadPoolExecutor(max_workers=workers) as executor:
        tasks = [executor.submit(download, url_root, name, location)
                 for name, location in games_to_download]
        for count, result in enumerate(as_completed(tasks)):
            try:
                name = result.result()
            except Exception as e:
                type_ = type(e)
                print(f'Error {type_}: {e}')
            else:
                print(f'{name} downloaded')
                percent = (1 - count / total_count) * 100
                sys.stdout.write('\r%(percent).2f%%' % {'percent': percent})
                sys.stdout.flush()
    print('')


# from collections import OrderedDict
# def files_sha256():
#     """
#     print existing game archives' sha256

#     :return: a dict of sha256 string
#     """
#     result = {}
#     for identifier in game_infos_ordered['games']:
#         file = os.path.normcase(os.path.join(DESTINATION, identifier + '.zip'))
#         if os.path.isfile(file):
#             result[identifier] = generate_sha256(file)
#     return result


# def update_json(ordered_dict):
#     with open(os.path.join(root, 'games.json'), encoding='utf8', mode='w') as f:
#         f.write(json.dumps(ordered_dict, indent=2, ensure_ascii=False))


# def update_sha256():
#     """
#     update sha256 to the json

#     :return: the updated json
#     """
#     sha256_dict = files_sha256()
#     for identifier, sha256 in sha256_dict.items():
#         game_infos_ordered['games'][identifier]['sha256'] = sha256
#     update_json(game_infos_ordered)
#     return


if __name__ == '__main__':
    with open(ROOT.joinpath('games.json'), encoding='utf8') as f:
        # content = f.read()
        # game_infos_ordered = json.loads(content, object_pairs_hook=OrderedDict)
        # game_infos = json.loads(content)
        game_infos = json.load(f)
    main(BASE, DESTINATION, game_infos, WORKERS)
