import dataclasses
from datetime import datetime
from typing import List, Tuple
import random
import json
from dataclasses import dataclass


class InvalidMoveException(Exception):
    def __init__(self, message):
        self.message = message


@dataclass
class Domino:
    l: int
    r: int

    def flip(self):
        self.r, self.l = self.l, self.r

    def get_sort_score(self):
        if self.l > self.r:
            score = self.l * 10 + self.r
        else:
            score = self.r * 10 + self.l
        if self.l == self.r:
            score += 100
        return score

    def __repr__(self):
        return f"[{self.l}|{self.r}]"


def get_starting_domino(dominoes: List[Domino]):
    return max(dominoes, key=Domino.get_sort_score)


@dataclass
class Player:
    user_id: int
    name: str

    def __repr__(self):
        return f"Player {self.name}"


class DominoGame:
    def __init__(self, game_id: str, dominoes: List[Domino]):
        self.game_id = game_id
        self.is_started = False
        self.is_finished = False
        self.player_count = 0
        self.players: List[Player] = []
        self.player_passed: List[bool] = []
        self.player_dominoes: List[List[Domino]] = []
        self.domino_stack = dominoes
        self.history: List[Tuple[str, str]] = []
        self.played_dominoes: List[Domino] = []
        self.current_player_number = None
        self.has_picked_up = False
        self.last_update_time = datetime.now()
        self.winner = None
        self.winner_message = None
        self.add_event(None, "Game created")

    def add_player(self, player: Player):
        if self.is_started:
            raise InvalidMoveException("Game has already started.")
        if self.player_count == 4:
            raise InvalidMoveException("Game already has a maximum of 4 players.")
        self.player_count += 1
        self.players.append(player)
        self.player_passed.append(False)
        self.player_dominoes.append([])
        self.add_event(player, f"{player.name} has joined the game.")

    def start_game(self, current_user):
        if self.player_count < 2:
            raise InvalidMoveException("Game requires at least two players to start.")

        if self.is_started:
            raise InvalidMoveException("The game has already been started.")

        for i in range(0, 7):
            for player_num in range(0, self.player_count):
                self.player_dominoes[player_num].append(self.domino_stack.pop())
        self.current_player_number = self.__get_start_player()
        self.has_picked_up = False
        self.is_started = True
        self.player_passed = [False] * self.player_count
        self.add_event(None, f"{current_user.name} started the game.")

        starting_domino = get_starting_domino(self.player_dominoes[self.current_player_number])
        self.__play_domino(starting_domino, True)

    def play_domino(self, current_user, domino: Domino, is_left: bool):
        self.assert_current_user(current_user)
        self.__play_domino(domino, is_left)

    def __play_domino(self, domino: Domino, is_left: bool):
        current_player = self.players[self.current_player_number]
        current_player_dominoes = self.player_dominoes[self.current_player_number]
        if domino not in current_player_dominoes and domino.flip() not in current_player_dominoes:
            raise InvalidMoveException("You don't have that domino.")

        if is_left:
            if self.played_dominoes and self.played_dominoes[0].l != domino.r:
                if self.played_dominoes[0].l == domino.l:
                    domino.flip()
                else:
                    raise InvalidMoveException("You cannot play that domino here.")
            self.player_dominoes[self.current_player_number] = [d for d in current_player_dominoes if
                                                                (domino.l, domino.r) not in [(d.l, d.r), (d.r, d.l)]]
            self.played_dominoes.insert(0, domino)
        else:
            if self.played_dominoes and self.played_dominoes[-1].r != domino.l:
                if self.played_dominoes[-1].r == domino.r:
                    domino.flip()
                else:
                    raise InvalidMoveException("You cannot play that domino here.")
            self.player_dominoes[self.current_player_number] = [d for d in current_player_dominoes if
                                                                (domino.l, domino.r) not in [(d.l, d.r), (d.r, d.l)]]
            self.played_dominoes.append(domino)

        self.add_event(current_player, f"{current_player.name} played domino {domino}")
        self.end_turn()

    def end_turn(self):
        if not self.check_win():
            self.goto_next_player()

    def goto_next_player(self):
        self.current_player_number += 1
        if self.current_player_number >= self.player_count:
            self.current_player_number = 0
        self.has_picked_up = False
        self.player_passed[self.current_player_number] = False

    def pick_up(self, current_user):
        self.assert_current_user(current_user)

        current_player = self.players[self.current_player_number]
        current_player_dominoes = self.player_dominoes[self.current_player_number]

        if self.has_picked_up:
            raise InvalidMoveException("You have already picked up a domino this turn.")

        if not self.domino_stack:
            raise InvalidMoveException("There are no dominoes left in the stack.")

        picked_domino = self.domino_stack.pop()
        current_player_dominoes.append(picked_domino)

        self.has_picked_up = True
        self.add_event(current_player, f"{current_player.name} picked up a domino")

        return picked_domino

    def pass_turn(self, current_user):


        self.assert_current_user(current_user)

        current_player = self.players[self.current_player_number]

        if not self.has_picked_up and self.domino_stack:
            raise InvalidMoveException("You must pick up before passing.")

        self.player_passed[self.current_player_number] = True
        self.add_event(current_player, f"{current_player.name} has passed")
        self.end_turn()

    def assert_current_user(self, current_user):
        if self.is_finished:
            raise InvalidMoveException("The game has finished.")
        current_player = self.players[self.current_player_number]
        if current_user.id != current_player.user_id:
            raise InvalidMoveException(f"It is not your turn. It is {current_player.name}'s turn.")

    def add_event(self, player, text):
        self.last_update_time = datetime.now()
        event = (self.last_update_time.strftime("%H:%M:%S"), text)
        print(event)
        self.history.append(event)

    def check_win(self):
        for player_number, dominoes in enumerate(self.player_dominoes):
            if len(dominoes) == 0:
                self.player_won(player_number, f"has gone out.")
                return True

        if False not in self.player_passed and len(self.domino_stack) == 0:
            winner_details = self.get_points_stalemate()
            winner_player_number = winner_details["winner_player"]
            winner_player_points = winner_details["scores"][winner_player_number]
            self.player_won(winner_player_number, f"has {winner_player_points} points after all players passed.")
            return True

        return False

    def player_won(self, player_number, message):
        self.is_finished = True
        self.winner = player_number
        self.winner_message = f"{self.players[self.winner].name} {message}"

    def get_view(self, current_user):
        player = self.find_player_by_user(current_user)
        player_number = self.players.index(player)
        return {
            "game_id": self.game_id,
            "is_started": self.is_started,
            "is_finished": self.is_finished,
            "last_update": str(self.last_update_time),
            "you": player,
            "player_number": player_number,
            "your_dominoes": self.player_dominoes[player_number],
            "players": [{"number": i, "name": player.name, "dominoes": len(self.player_dominoes[i])} for i, player in
                        enumerate(self.players)],
            "next_player_number": self.current_player_number,
            "played_dominoes": self.played_dominoes,
            "remaining_dominoes": len(self.domino_stack),
            "can_pick_up": len(self.domino_stack) > 0 and not self.has_picked_up,
            "history": self.history,
            "winner": self.winner,
            "winner_message": self.winner_message
        }

    def __get_start_player(self):
        player_numbers = list(range(self.player_count))
        return max(player_numbers, key=lambda p: get_starting_domino(self.player_dominoes[p]).get_sort_score())

    def get_points_stalemate(self):
        scores = []
        for player_number, dominoes in enumerate(self.player_dominoes):
            person_score = 0
            for domino in dominoes:
                person_score += domino.l + domino.r
            scores.append(person_score)
        winner_player = min(range(0, self.player_count), key=lambda p: scores[p])
        return {"winner_player": winner_player, "scores": scores}

    def __repr__(self):
        return f"""Game State: {self.id}
{self.players}
player_dominoes={self.player_dominoes}
next_player={self.players[self.current_player_number]}
played_dominoes={self.played_dominoes}
"""

    def find_player_by_user(self, current_user):
        matching_players = [player for player in self.players if player.user_id == current_user.id]
        if not matching_players:
            raise Exception("Player not found with id " + current_user.id)
        return matching_players[0]


def get_shuffled_dominoes():
    dominoes = []
    for left in range(0, 7):
        for right in range(left, 7):
            dominoes.append(Domino(left, right))
    random.shuffle(dominoes)
    return dominoes


class EnhancedJSONEncoder(json.JSONEncoder):
    def default(self, o):
        if dataclasses.is_dataclass(o):
            return dataclasses.asdict(o)
        return super().default(o)
