from retroquest.engine.ui.RetroQuestApp import RetroQuestApp
from retroquest.engine.Game import Game
from retroquest.act1.Act1 import Act1

USE_TEXTUAL_UI = True  # Set to False to use the classic console UI

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
