
import sys
from retroquest.engine.textualui.TextualApp import TextualApp
from retroquest.engine.promptui.PromptSessionApp import PromptSessionApp
from retroquest.engine.Game import Game
from retroquest.act1.Act1 import Act1
from retroquest.act2.Act2 import Act2

USE_TEXTUAL_UI = True

if '-oldschool' in sys.argv:
    USE_TEXTUAL_UI = False

def main() -> None:
    game = Game([Act1(), Act2()])
    if USE_TEXTUAL_UI:
        app = TextualApp(game)
    else:
        app = PromptSessionApp(game)
    app.run()

if __name__ == '__main__':
    main()
