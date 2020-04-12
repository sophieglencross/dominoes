import secrets
from typing import Dict

from dominoes.domino_state import *

games: Dict[str, DominoGame] = dict()


def get_current_game(user, game_id: str):

    # Find the game that the client thinks we are playing
    if game_id and game_id in games.keys():
        return games[game_id]

    # Find the game that we are already playing
    for game_id, game in games.items():
        if not game.is_finished and user.id in [player.user_id for player in game.players]:
            return game

    # Start a new game
    return join_any_game(user)


def join_any_game(user):

    # Look for games we have already joined
    for game_id, game in games.items():
        if not game.is_started and user.id in [player.user_id for player in game.players]:
            return game

    # Look for games which are not full
    for game_id, game in games.items():
        if not game.is_started and len(game.players) < 4:
            game.add_player(Player(user.id, user.name))
            return game

    # Create a new game
    game = DominoGame(secrets.token_hex(), get_shuffled_dominoes())
    game.add_player(Player(user.id, user.name))
    games[game.game_id] = game
    return game


def get_open_games(user):
    return [game for game in games.values() if not game.is_started and user.id not in [player.user_id for player in game.players]]


def get_my_games(user):
    return [game for game in games.values() if user.id in [player.user_id for player in game.players]]


def get_game(game_id: str):
    game = games.get(game_id)
    if not game:
        raise InvalidMoveException("Game not found.")
    return game
