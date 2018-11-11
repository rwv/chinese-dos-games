import hashlib
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from collections import namedtuple
from pathlib import Path
from urllib.parse import quote, urljoin
from urllib.request import urlopen

ROOT = Path(__name__).resolve().parent
INFO = ROOT.joinpath('games.json')
DESTINATION = ROOT.joinpath('bin')
BASE = 'https://dos.zczc.cz/static/games/bin/'
WORKERS = 5
GAME_INFO = namedtuple('GAME_INFO', 'name', 'file_location', 'url')


def check_integrity(name, location, hash_value):
    if location.is_file():
        sha256 = hashlib.sha256()
        with open(location, 'rb') as f:
            sha256.update(f.read())
        return sha256.hexdigest() == hash_value, name, location
    else:
        return False, name, location


def validate(game_name_locations, game_info, workers):
    print('Checking integrity')
    skipped_games = set()
    total_count = len(game_name_locations)
    with ThreadPoolExecutor(max_workers=workers) as executor:
        tasks = [executor.submit(check_integrity, name, location, game_info['games'][name]['sha256'])
                 for name, location in game_name_locations]
        for count, result in enumerate(as_completed(tasks), start=1):
            print('%(now)5d / %(all)5d' % {'now': count, 'all': total_count}, end='\r')
            is_in_good_piece, name, location = result.result()
            if is_in_good_piece:
                skipped_games.add((name, location))
    print('')
    return skipped_games


def download_(url, location):
    response = urlopen(url)
    with open(location, 'wb') as file:
        file.write(response.read())
    return location.stem


def download(games_to_download, url, workers):
    print('Downloading')
    total_count = len(games_to_download)
    with ThreadPoolExecutor(max_workers=workers) as executor:
        tasks = [executor.submit(download_, urljoin(url, quote(str(Path(name).with_suffix('.zip')))), location)
                 for name, location in games_to_download]
        for count, result in enumerate(as_completed(tasks), start=1):
            try:
                name = result.result()
            except Exception as e:
                type_ = type(e)
                print(f'Error {type_}: {e}')
            else:
                print('%(now)5d / %(all)5d <= %(name)20s downloaded' %
                      {'now': count, 'all': total_count, 'name': name}, end='\r')
    print('')


def main(url_root, destination, game_info, workers):
    """
    check game archives whether exists and their checksum, download from target.

    :return: the list of downloaded file
    """
    if not destination.is_dir():
        destination.mkdir()

    game_name_locations = set((name, destination.joinpath(name).with_suffix('.zip'))
                              for name in game_info['games'])

    skipped_games = validate(game_name_locations, game_info, workers)
    if skipped_games:
        skipped_games_count = len(skipped_games)
        print(f'{skipped_games_count} games are good')

    games_to_download = game_name_locations - skipped_games
    if games_to_download:
        download(games_to_download, url_root, workers)
    else:
        print('No need to download')
    print('Game on!')


if __name__ == '__main__':
    with open(INFO, encoding='utf8') as f:
        game_info = json.load(f)
    main(BASE, DESTINATION, game_info, WORKERS)
