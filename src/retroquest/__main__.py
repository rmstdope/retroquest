from retroquest.engine.ui.RetroQuestApp import RetroQuestApp
from retroquest.engine.Game import Game
from retroquest.act1.Act1 import Act1

USE_TEXTUAL_UI = True  # Set to False to use the classic console UI

# TODO It is not possible to get completion on the 'bread' part of 'look bread'
# TODO It is not possible to get completion on 'give photograph to grandmother'
# TODO Revive spell is shown twice in the spell list
def main():
    if USE_TEXTUAL_UI:
        app = RetroQuestApp()
        app.run()
    else:
        act = Act1()
        game = Game(act)
        game.run()

if __name__ == '__main__':
    main()
