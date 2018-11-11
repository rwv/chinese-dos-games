import hashlib
import json
from collections import namedtuple
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import quote, urljoin
from urllib.request import urlopen

ROOT = Path(__name__).resolve().parent
INFO = ROOT.joinpath('games.json')
DESTINATION = ROOT.joinpath('bin')
BASE = 'https://dos.zczc.cz/static/games/bin/'
WORKERS = 5
GAME_INFO = namedtuple('GAME_INFO', ['name', 'file_location', 'url', 'hash'])


def check_integrity(info):
    location = info.file_location
    hash = info.hash

    if location.is_file():
        sha256 = hashlib.sha256()
        with open(location, 'rb') as f:
            sha256.update(f.read())
        return sha256.hexdigest() == hash, info
    else:
        return False, info


def validate(infos, workers):
    print('Checking integrity')
    skipped_games = set()
    total_count = len(infos)
    with ThreadPoolExecutor(max_workers=workers) as executor:
        tasks = [executor.submit(check_integrity, info) for info in infos]
        for count, result in enumerate(as_completed(tasks), start=1):
            print('%(now)5d / %(all)5d' %
                  {'now': count, 'all': total_count}, end='\r')
            is_in_good_piece, info = result.result()
            if is_in_good_piece:
                skipped_games.add(info)
    print('')
    return skipped_games


def download_(info):
    url = info.url
    location = info.file_location

    response = urlopen(url)
    with open(location, 'wb') as file:
        file.write(response.read())
    return location.stem


def download(infos, workers):
    print('Downloading')
    total_count = len(infos)
    with ThreadPoolExecutor(max_workers=workers) as executor:
        tasks = [executor.submit(download_, info)
                 for info in infos]
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


def main(info, workers):
    """
    check game archives whether exists and their checksum, download from target.
    """
    skipped_games = validate(info, workers)
    if skipped_games:
        skipped_games_count = len(skipped_games)
        print(f'{skipped_games_count} games are good')

    games_to_download = info - skipped_games
    if games_to_download:
        download(games_to_download, workers)
    else:
        print('No need to download')
    print('Game on!')


if __name__ == '__main__':
    with open(INFO, encoding='utf8') as f:
        game_info = json.load(f)

    destination = DESTINATION
    info = set(GAME_INFO(name=name,
                         file_location=destination.joinpath(name).with_suffix('.zip'),
                         url=urljoin(BASE, quote(str(Path(name).with_suffix('.zip')))),
                         hash=game_info['games'][name]['sha256'])
               for name in game_info['games'])

    if not destination.is_dir():
        destination.mkdir()

    main(info, WORKERS)
