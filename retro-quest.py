import rooms

all_rooms = dict()
all_rooms['campfire'] = rooms.Campfire()

current_room = all_rooms['campfire']

while 1:
    print(str(current_room))
    text = input('> ')
    match text:
        case 'look':
            print('You take a look around.')
        case _:
            print(f'You are uncertain how to "{text}"')
