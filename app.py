from flask import Flask
from flask import render_template, redirect, url_for

from game_infos import game_infos
from packager import generate_script

app = Flask(__name__)


@app.route('/games/<gamename>/')
def game(gamename):
    game_info = game_infos["games"][gamename]
    return render_template('game.html',
                           script_content=generate_script(game_info["executeFile"], game_info["script"]))


@app.route('/games/<gamename>/game.data')
def game_data(gamename):
    return redirect(url_for('static', filename='gamedata/{}/game.data'.format(gamename)), code=301)


@app.route('/games/<gamename>/saves/<save_number>/')
def game_save(gamename, save_number):
    game_info = game_infos["games"][gamename]
    return render_template('game.html',
                           script_content=generate_script(game_info["saveExecute"].format(save_number),
                                                          game_info['script']))


@app.route('/games/<gamename>/saves/<save_number>/game.data')
def game_save_data(gamename, save_number):
    return redirect(url_for('static', filename='gamedata/{}/game.data'.format(gamename)), code=301)


if __name__ == '__main__':
    app.run(debug=True)
