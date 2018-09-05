from flask import Flask
from flask import render_template, redirect, url_for

from game_infos import game_infos

app = Flask(__name__)


@app.route('/')
def index():
    return render_template('index.html', games=game_infos['games'])


@app.route('/about')
def about():
    return render_template('about.html', games=game_infos['games'])


@app.route('/games/<identifier>/')
def game(identifier):
    game_info = game_infos["games"][identifier]
    return render_template('game.html', game_info=game_info)


@app.route('/games/<identifier>/logo/emularity_color_small.png')
def emularity_logo(identifier):
    return redirect(url_for('static', filename='emularity/emularity_color_small.png'), code=301)


if __name__ == '__main__':
    app.run(debug=True)
