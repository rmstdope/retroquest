class Room:
    def __init__(self):
        pass

    def __str__(self):
        return self.get_description()

    def get_description(self):
        return "Empty Room"

class Campfire(Room):
    def __init__(self):
        super().__init__()

    def __str__(self):
        return super().__str__()

    def get_description(self):
        return "A clearing in the midst of the forst. There is a campfire burning, spreading long dancing shadows around the clearing."
