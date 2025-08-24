class Act:
    """
    Represents a collection of rooms, quests, items, and characters for a given act in the game.
    This is a simple container class to help organize content by act.
    """
    def __init__(self, name, rooms, quests, music_file=None, music_info=''):
        self.name = name
        self.rooms = rooms
        self.quests = quests
        self.music_file = music_file
        self.music_info = music_info

    def get_act_intro(self) -> str:
        return ""
