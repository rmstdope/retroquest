from .GameState import GameState

class Act:
    """
    Represents a collection of rooms, quests, items, and characters for a given act in the game.
    This is a simple container class to help organize content by act.
    """
    def __init__(self, name: str, rooms: dict, quests: list, music_file: str, music_info: str) -> None:
        self.name = name
        self.rooms = rooms
        self.quests = quests
        self.music_file = music_file
        self.music_info = music_info

    def get_act_intro(self) -> str:
        return ""

    def is_completed(self, game_state: GameState) -> bool:
        raise NotImplementedError("Subclasses must implement the is_completed method")
