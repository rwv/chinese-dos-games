from game_infos import game_infos
import os
import inspect
import json
import os


command = 'zip -r -9 {} . -x "*.DS_Store"'
root = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))

games = game_infos['games']
for k, v in games.items():
    game_folder = os.path.join(root, 'games', v['gameFolder'])
    print('change to {}'.format(game_folder))
    os.chdir(game_folder)
    output_file = os.path.join(root, 'static', 'gamedata', '{}.zip'.format(v['identifier']))
    com = command.format(output_file)
    print(com)
    os.system(com)
    
