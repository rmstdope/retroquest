class Room:
    def __init__(self):
        pass

    def __str__(self):
        return self.get_description()

    def get_description(self):
        return "Empty Room"

    def synonyms(self) -> dict:
        return {}

    def translate(self, str) -> str:
        synonyms = {'nw': 'northwest',
                    'ne': 'northeast',
                    'go': 'move',
                    'walk': 'move',
                    'run': 'move'}
        synonyms.update(self.synonyms())
        str.lower()
        words = str.split()
        str = ''
        for w in words:
            if w in synonyms:
                w = synonyms[w]
            str += w + ' '
        return str

    def process_command(self, command: str) -> None:
        command = self.translate(command)
        words = command.split()
        match (words[0].lower()):
            case 'look':
                print('You take a look around.')
            case 'exit':
                print('You leave the game.')
                exit(0)
            case 'help':
                print('No, there is no help for you!')
            case _:
                print(f'You are uncertain how to "{command}"')

