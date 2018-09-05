from flask import Flask
from flask import render_template, redirect, url_for

from game_infos import game_infos
from packager import generate_script

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
    return render_template('game.html',
                           script_content=generate_script(game_info["executable"], game_info["script"]),
                           game_info=game_info)

@app.route('/games/<identifier>/logo/emularity_color_small.png')
def emularity_logo(identifier):
    return redirect(url_for('static', filename='emularity/emularity_color_small.png'), code=301)


@app.route('/games/<identifier>/image')
def game_image(identifier):
    cover_filename = game_infos["games"][identifier]['coverFilename']
    return redirect(url_for('static', filename='img/games/{}/{}'.format(identifier, cover_filename)), code=301)



if __name__ == '__main__':
    app.run(debug=True)
