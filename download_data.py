import hashlib
import inspect
import os
import json
import urllib.request

import ssl

from concurrent.futures import ThreadPoolExecutor, wait

root = os.path.dirname(os.path.abspath(
    inspect.getfile(inspect.currentframe())))

PREFIX = "https://dos-bin.zczc.cz/"
DESTINATION = os.path.join(root, 'bin')
BUF_SIZE = 65536
THREAD_SIZE = 10

# read game infos from games.json
with open(os.path.join(root, 'games.json'), encoding='utf8') as f:
    game_infos = json.load(f)


def generate_sha256(file):
    sha256 = hashlib.sha256()
    with open(file, 'rb') as f:
        while True:
            data = f.read(BUF_SIZE)
            if not data:
                break
            sha256.update(data)
    return sha256.hexdigest()

ssl._create_default_https_context = ssl._create_unverified_context

def download(identifier, url, file):
    try:
        print(f'Downloading {identifier} game file')
        result = urllib.request.urlretrieve(url, file)
        print(result)
        print(f'DownloadSuccess')
    except urllib.error.HTTPError as e:
        print("Fail:"+str(e))


def main(prefix=PREFIX, destination=DESTINATION):
    # create folder
    os.makedirs(destination, exist_ok=True)

    executor = ThreadPoolExecutor(max_workers=THREAD_SIZE)
    all_task = list()

    downloaded = list()
    for identifier in game_infos['games'].keys():
        file = os.path.normcase(os.path.join(destination, identifier + '.zip'))
        url = prefix + urllib.parse.quote(identifier) + '.zip'
        if os.path.isfile(file) and generate_sha256(file) == game_infos['games'][identifier]['sha256']:
            print(f'skip {identifier}')
        else:
            downloaded.append(identifier)
            task = executor.submit(download, identifier, url, file)
            all_task.append(task)

    wait(all_task)
    return downloaded


if __name__ == '__main__':
    main()
