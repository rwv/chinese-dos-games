import inspect
import os
import urllib.request

from game_infos import game_infos

root = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))

PREFIX = "https://dos.zczc.cz/static/gamedata/"
DESTINATION = os.path.join(root, 'static', 'gamedata')

# 创建文件夹
folder = os.path.isdir(DESTINATION)
if not folder:
    os.makedirs(DESTINATION)

for identifier in game_infos['games'].keys():
    url = PREFIX + urllib.parse.quote(identifier) + '.zip'
    file = os.path.normcase(os.path.join(DESTINATION, identifier + '.zip'))
    print('Downloading {} game file'.format(identifier))
    urllib.request.urlretrieve(url, file)
