from flask import Blueprint, request
from flask_login import login_required, current_user
from http import HTTPStatus
from . import db, Domino, InvalidMoveException

import json
from flask import render_template
from dominoes.game import get_current_game
from dominoes.domino_state import EnhancedJSONEncoder

main = Blueprint('main', __name__)

@main.route('/')
@login_required
def index():
    return render_template('index.html')

@main.route('/view')
@login_required
def view_game():
    my_game = get_current_game()
    view = my_game.get_view(current_user)
    return json.dumps(view, cls=EnhancedJSONEncoder)

@main.route('/submit-move', methods=['POST'])
@login_required
def submit_move():

    domino_left = int(request.form.get('domino_left'))
    domino_right = int(request.form.get('domino_right'))
    is_left = request.form.get('is_left').lower() == "true"

    try:
        my_game = get_current_game()
        my_game.play_domino(current_user, Domino(l=domino_left, r=domino_right), is_left)
    except InvalidMoveException as ex:
        return ex.message, HTTPStatus.NOT_ACCEPTABLE.value

    view = my_game.get_view(current_user)
    return json.dumps(view, cls=EnhancedJSONEncoder)


@main.route('/pick-up', methods=['POST'])
@login_required
def pick_up():

    try:
        my_game = get_current_game()
        domino = my_game.pick_up(current_user)
    except InvalidMoveException as ex:
        return ex.message, HTTPStatus.NOT_ACCEPTABLE.value

    view = my_game.get_view(current_user)
    view["highlight_domino"] = domino
    return json.dumps(view, cls=EnhancedJSONEncoder)


@main.route('/pass', methods=['POST'])
@login_required
def pass_turn():

    try:
        my_game = get_current_game()
        my_game.pass_turn(current_user)
    except InvalidMoveException as ex:
        return ex.message, HTTPStatus.NOT_ACCEPTABLE.value

    view = my_game.get_view(current_user)
    return json.dumps(view, cls=EnhancedJSONEncoder)