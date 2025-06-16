from .Character import Character
from ..GameState import GameState

class Priest(Character):
    def __init__(self) -> None:
        super().__init__(
            name="Priest",
            description="A kindly priest who tends the chapel, offering blessings and sharing the lore of Eldoria."
        )

    def talk_to(self, game_state: GameState) -> str:
        game_state.set_story_flag("priest_talked_to", True) # Set the story flag
        return "The priest offers a serene smile. 'Welcome, child. The chapel is a sanctuary for all who seek peace. The shadows in our land grow long, but faith can be a guiding light.'"
