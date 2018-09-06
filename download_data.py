import urllib.request, os
from game_infos import game_infos
import inspect

PREFIX = "https://dos.zczc.cz/static/gamedata/"
DESTINATION = os.path.normcase('static/gamedata/')

root = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))

# 创建文件夹
folder = os.path.exists(DESTINATION)
if not folder:
    os.makedirs(DESTINATION)

opener = urllib.request.build_opener()
opener.addheaders = [('User-Agent','Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/36.0.1941.0 Safari/537.36')]
urllib.request.install_opener(opener)

for identifier in game_infos['games'].keys():
    urllib.request.urlretrieve(PREFIX + urllib.parse.quote(identifier) + '.zip', os.path.join(root, DESTINATION, identifier + '.zip'))