from ...engine.Character import Character
from ...engine.GameState import GameState

class Historians(Character):
    def __init__(self) -> None:
        super().__init__(
            name="historians",
            description="A group of learned scholars who maintain the court's historical records and genealogical archives. They are eager to examine any historical documents or artifacts.",
        )

    def talk(self, game_state: GameState) -> str:
        if game_state.get_story_flag("showed_journal_to_historians"):
            return ("[character_name]Historians[/character_name]: The journal you showed us was most illuminating! "
                    "The references to Willowbrook's bloodlines confirm what we suspected from the ancient chronicles. "
                    "Your heritage appears to be quite significant indeed.")
        else:
            return ("[character_name]Historians[/character_name]: Welcome to the historical archives. We maintain "
                    "records of regional history, family genealogies, and ancient chronicles. Do you have any "
                    "historical documents or artifacts you'd like us to examine?")