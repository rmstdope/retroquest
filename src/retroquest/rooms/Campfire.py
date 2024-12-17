from retroquest.rooms.Room import Room

class Campfire(Room):
    def __init__(self):
        super().__init__()

    def __str__(self):
        return super().__str__()

    def synonyms(self) -> dict:
        return {'small path': 'northwest',
                'large path': 'northeast'}

    def exits(self) -> dict:
        return {'northwest': 'forest',
                'northeast': 'cave'}

    def get_description(self):
        return '''A clearing in the midst of the forst.
There is a campfire burning, spreading long dancing shadows around the clearing. The fire crackles and pops, and the smell of burning wood fills the air. The clearing is surrounded by trees, and the path you came from is barely visible behind you.
There are two paths leading away from the clearing. A smaller one leading northwest and a larger one leading northeast.'''
