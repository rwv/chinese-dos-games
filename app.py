from flask import Flask
from flask import render_template, redirect, url_for

from game_infos import game_infos
from packager import generate_script

app = Flask(__name__)


@app.route('/')
def index():
    return "Hello World"


@app.route('/about')
def about():
    return render_template('about.html', games=game_infos['games'])


@app.route('/games/<identifier>/')
def game(identifier):
    game_info = game_infos["games"][identifier]
    return render_template('game.html',
                           script_content=generate_script(game_info["executable"], game_info["script"]),
                           game_info=game_info)


@app.route('/games/<identifier>/game.data')
def game_data(identifier):
    return redirect(url_for('static', filename='gamedata/{}/game.data'.format(identifier)), code=301)


@app.route('/games/<identifier>/saves/')
def game_saves(identifier):
    game_info = game_infos["games"][identifier]
    return render_template('saves.html', game_info=game_info)


@app.route('/games/<identifier>/saves/<save_number>/')
def game_save(identifier, save_number):
    game_info = game_infos["games"][identifier]
    return render_template('game.html',
                           script_content=generate_script(game_info["executable"].format(save_number),
                                                          game_info['script']),
                           game_info=game_info,
                           current_save=game_info['sampleSaves']['descriptions'][int(save_number)])


@app.route('/games/<identifier>/saves/<save_number>/game.data')
def game_save_data(identifier, save_number):
    return game_data(identifier)


if __name__ == '__main__':
    app.run(debug=True)
