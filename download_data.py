import hashlib
import inspect
import os
import json
import asyncio
import aiohttp
import aiofiles
import urllib

from collections import OrderedDict


root = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))

PREFIX = "https://dos.zczc.cz/static/games/bin/"
DESTINATION = os.path.join(root, 'bin')
BUF_SIZE = 65536
MAX_CONCURRENT = 10
MAX_SIZE = 10

with open(os.path.join(root, 'games.json'), encoding='utf8') as f:
    content = f.read()
    game_infos_ordered = json.loads(content, object_pairs_hook=OrderedDict)
    game_infos = json.loads(content)


def update_json(ordered_dict):
    with open(os.path.join(root, 'games.json'), encoding='utf8', mode='w') as f:
        f.write(json.dumps(ordered_dict, indent=2, ensure_ascii=False))


def generate_sha256(file):
    """
    generate file's sha256 checksum

    :param file: file's location
    :return: sha256 string
    """
    sha256 = hashlib.sha256()
    with open(file, 'rb') as f:
        while True:
            data = f.read(BUF_SIZE)
            if not data:
                break
            sha256.update(data)
    return sha256.hexdigest()


async def download(semaphore, url, file, identifier):
    async with semaphore, aiohttp.ClientSession(
        connector=aiohttp.TCPConnector(
            verify_ssl=False
        )
    ) as session:
        async with session.get(url) as response:
            contents = await response.read()
            print('Downloading {} game file'.format(identifier))
            async with aiofiles.open(file, 'wb') as f:
                await f.write(contents)


def main(prefix=PREFIX, destination=DESTINATION):
    """
    check game archives whether exists and their checksum, download from target.

    :return: the list of downloaded file
    """
    # create folder
    folder = os.path.isdir(destination)
    if not folder:
        os.makedirs(destination)

    downloaded = list()
    semaphore = asyncio.Semaphore(MAX_CONCURRENT)

    for identifier in game_infos['games'].keys():
        file = os.path.normcase(os.path.join(destination, identifier + '.zip'))
        url = prefix + urllib.parse.quote(identifier) + '.zip'
        if os.path.isfile(file) and generate_sha256(file) == game_infos['games'][identifier]['sha256']:
            print('skip {}'.format(identifier))
        else:
            downloaded.append([semaphore, url, file, identifier])

    loop = asyncio.get_event_loop()
    tasks = [loop.create_task(download(*para)) for para in downloaded]
    loop.run_until_complete(asyncio.wait(tasks))
    loop.close()

    return downloaded


def files_sha256():
    """
    print existing game archives' sha256

    :return: a dict of sha256 string
    """
    result = dict()
    for identifier in game_infos_ordered['games'].keys():
        file = os.path.normcase(os.path.join(DESTINATION, identifier + '.zip'))
        if os.path.isfile(file):
            result[identifier] = generate_sha256(file)
    return result


def update_sha256():
    """
    update sha256 to the json

    :return: the updated json
    """
    sha256_dict = files_sha256()
    for identifier, sha256 in sha256_dict.items():
        game_infos_ordered['games'][identifier]['sha256'] = sha256
    update_json(game_infos_ordered)
    return


if __name__ == '__main__':
    main()
