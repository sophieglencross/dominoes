from flask import Flask
from flask_login import LoginManager
from flask_sqlalchemy import SQLAlchemy

# init SQLAlchemy so we can use it later in our models
db = SQLAlchemy()

def create_app():
    app = Flask(__name__)

    app.config['SECRET_KEY'] = 'nef83nafn(*bknsf'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///db.sqlite'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)
    login_manager = LoginManager()
    login_manager.login_view = 'auth.login'
    login_manager.init_app(app)

    from dominoes.models import User

    db.create_all(app=app)

    # blueprint for auth routes in our app
    from dominoes.auth import auth as auth_blueprint
    app.register_blueprint(auth_blueprint)

    # blueprint for non-auth parts of app
    from dominoes.main import main as main_blueprint
    app.register_blueprint(main_blueprint)

    @login_manager.user_loader
    def load_user(user_id):
        # since the user_id is just the primary key of our user table, use it in the query for the user
        return User.query.get(int(user_id))

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(host="0.0.0.0", port=8080)
