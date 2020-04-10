import dataclasses
from datetime import datetime
from typing import List
import secrets
import random
import json
from dataclasses import dataclass


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
    name: str
    email: str
    token: str

    def __repr__(self):
        return f"Player {self.name}"


class DominoGame:
    def __init__(self, id: str, players: List[Player], dominoes: List[Domino]):
        assert 2 <= len(players) <= 4
        self.id = id
        self.players = players
        self.player_count = len(self.players)
        self.player_dominoes = [list() for i in range(self.player_count)]
        self.domino_stack = dominoes
        self.history = []
        self.played_dominoes = []
        self.next_player = None

    def start_game(self):
        for i in range(0, 7):
            for player_num in range(0, self.player_count):
                self.player_dominoes[player_num].append(self.domino_stack.pop())
        self.next_player = self.__get_start_player()
        self.add_event(None, f"Game starts")

        starting_domino = get_starting_domino(self.player_dominoes[self.next_player])
        self.play_domino(starting_domino, True)

    def play_domino(self, domino: Domino, is_left: bool):
        current_player = self.players[self.next_player]
        current_player_dominoes = self.player_dominoes[self.next_player]
        if domino not in current_player_dominoes and domino.flip() not in current_player_dominoes:
            raise Exception("You don't have that domino")

        if is_left:
            if self.played_dominoes and self.played_dominoes[0].left != domino.r:
                if self.played_dominoes[0].left == domino.l:
                    domino.flip()
                else:
                    raise Exception("You cannot play that domino here")
            current_player_dominoes.remove(domino)
            self.played_dominoes.insert(0, domino)
        else:
            if self.played_dominoes and self.played_dominoes[-1].right != domino.l:
                if self.played_dominoes[-1].right == domino.r:
                    domino.flip()
                else:
                    raise Exception("You cannot play that domino here")
            current_player_dominoes.remove(domino)
            self.played_dominoes.append(domino)

        self.add_event(current_player, f"{current_player.name} played domino {domino}")
        self.next_player += 1
        if self.next_player >= self.player_count:
            self.next_player = 0

    def add_event(self, player, text):
        event = (datetime.now().strftime("%H:%M:%S"), text)
        print(event)
        self.history.append(event)

    def get_view(self, player_token):
        player = self.find_player_by_token(player_token)
        player_number = self.players.index(player)
        return {
            "you": player,
            "player_number": player_number,
            "your_dominoes": self.player_dominoes[player_number],
            "players": [{"number": i, "name": player.name, "dominoes": len(self.player_dominoes[i])} for i, player in
                        enumerate(self.players)],
            "next_player_number": self.next_player,
            "played_dominoes": self.played_dominoes,
            "remaining_dominoes": len(self.domino_stack),
            "history": self.history
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
next_player={self.players[self.next_player]}
played_dominoes={self.played_dominoes}
"""

    def find_player_by_token(self, player_token):
        matching_players = [player for player in self.players if player.token == player_token]
        if not matching_players:
            raise Exception("Player not found with token")
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


if __name__ == '__main__':
    my_game = DominoGame("1234abc", [
        Player("Sophie", "sophie@glencross.org", secrets.token_hex()),
        Player("Chris", "chris@glencross.org", secrets.token_hex()),
    ], get_shuffled_dominoes())
    my_game.start_game()
    print(my_game)
    view = my_game.get_view(my_game.players[0].token)

    print(view)

    print(json.dumps(view, cls=EnhancedJSONEncoder))
    print(my_game.get_points_stalemate())
