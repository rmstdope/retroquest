from ...engine.Character import Character
from ...engine.GameState import GameState

class Priest(Character):
    def __init__(self) -> None:
        super().__init__(
            name="priest",
            description="A kindly priest who tends the chapel, offering blessings and sharing the lore of Eldoria."
        )

    def talk_to(self, game_state: GameState) -> str:
        game_state.set_story_flag("priest_talked_to", True) # Set the story flag
        event_msg = f"[event]You speak with the [character_name]{self.get_name()}[/character_name].[/event]"
        return event_msg + "\n" + f"The [character_name]{self.get_name()}[/character_name] offers a serene smile. [dialogue]'Welcome, child. The chapel is a sanctuary for all who seek peace. The shadows in our land grow long, but faith can be a guiding light.'[/dialogue]"
