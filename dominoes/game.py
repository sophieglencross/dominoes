from dominoes.domino_state import *

current_game = None

def get_current_game():
    global current_game
    if current_game is None:
        current_game = DominoGame("1234abc", [
            Player("Sophie", "sophie@glencross.org", secrets.token_hex()),
            # Player("Emma", "emma@glencross.org", secrets.token_hex()),
            Player("Chris", "chris@glencross.org", secrets.token_hex()),
        ], get_shuffled_dominoes())
        current_game.start_game()
    return current_game
