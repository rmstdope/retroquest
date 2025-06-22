from ..GameState import GameState


class Quest:
    """
    Base class for all quests in RetroQuest.
    """
    def __init__(self, name: str, description: str, completion: str) -> None:
        self.name = name
        self.description = description
        self.completion = completion

    def check_trigger(self, game_state: GameState) -> bool:
        """Override in subclasses to check if the quest should be triggered."""
        return False

    def check_completion(self, game_state: GameState) -> bool:
        """Override in subclasses to check if the quest is completed."""
        return False
