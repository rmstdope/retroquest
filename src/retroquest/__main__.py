from retroquest.engine.Game import Game
from retroquest.act1.Act1 import Act1

def main():
    act = Act1()
    game = Game(act)
    game.run()

if __name__ == '__main__':
    main()
