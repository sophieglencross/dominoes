from flask import Flask, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_security import Security, SQLAlchemyUserDatastore, \
    UserMixin, RoleMixin, login_required

from dominoes.domino_state import *
app = Flask(__name__)

my_game = DominoGame("1234abc", [
    Player("Sophie", "sophie@glencross.org", secrets.token_hex()),
    Player("Chris", "chris@glencross.org", secrets.token_hex()),
], get_shuffled_dominoes())
my_game.start_game()

@app.route('/')
# @login_required
def home():
    return render_template('index.html')

@app.route('/view')
def start_game():
    view = my_game.get_view(my_game.players[0].token)
    return json.dumps(view, cls=EnhancedJSONEncoder)

if __name__ == '__main__':
    app.run(host="localhost", port=8080)
