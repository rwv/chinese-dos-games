from flask import Flask, jsonify, request, send_from_directory, make_response
from functools import wraps

from game_infos import game_infos, game_infos_with_cover, ROOT
import os

number_to_show_on_index = 42

app = Flask(__name__)

# 开发环境 CORS：允许前端 dev server 跨域访问 API
ALLOWED_ORIGINS = {'http://localhost:5173'}


def cors(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        resp = make_response(fn(*args, **kwargs))
        origin = request.headers.get('Origin')
        if origin in ALLOWED_ORIGINS:
            resp.headers['Access-Control-Allow-Origin'] = origin
            resp.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
            resp.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return resp
    return wrapper


@app.route('/api/games')
@cors
def api_games():
    return jsonify(count=len(game_infos['games']), games=list(game_infos['games'].values()))


@app.route('/api/games/<identifier>')
@cors
def api_game(identifier):
    game_info = game_infos['games'].get(identifier)
    if game_info is None:
        return jsonify(error='game not found'), 404
    return jsonify(game_info)


@app.route('/api/search')
@cors
def api_search():
    query = request.args.get('q')
    if not query:
        return jsonify(error='missing query'), 400
    results = [
        info for info in game_infos['games'].values()
        if query in info['name']['zh-Hans']
        or query in info['name'].get('en', '')
    ]
    return jsonify(count=len(results), games=results)


@app.route('/files/bin/<path:identifier>')
def serve_bin(identifier):
    bin_dir = os.path.join(ROOT, 'bin')
    return send_from_directory(bin_dir, identifier)


@app.route('/files/img/<path:filename>')
def serve_img(filename):
    img_dir = os.path.join(ROOT, 'img')
    response = send_from_directory(img_dir, filename)
    response.headers['Cache-Control'] = 'public, max-age=86400'
    return response


if __name__ == '__main__':
    app.run(debug=True)
