import sys
from prompt_toolkit import PromptSession
from retroquest.rooms.Campfire import Campfire

def main():
    all_rooms = dict()
    all_rooms['campfire'] = Campfire()
    current_room = all_rooms['campfire']
    session = PromptSession()

    while 1:
        print(str(current_room))
        text = session.prompt('>')
        text = current_room.translate(text)
        print(text)
        # text = input('> ')
        match text.lower():
            case 'look':
                print('You take a look around.')
            case _:
                print(f'You are uncertain how to "{text}"')
    sys.exit(0)

if __name__ == '__main__':
    main()
