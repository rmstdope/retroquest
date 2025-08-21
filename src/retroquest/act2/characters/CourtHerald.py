from ...engine.Character import Character
from ...engine.GameState import GameState

class CourtHerald(Character):
    def __init__(self) -> None:
        super().__init__(
            name="court herald",
            description="An elaborately dressed official who manages formal presentations and ceremonies at court. He scrutinizes documents and credentials with practiced expertise.",
        )

    def talk(self, game_state: GameState) -> str:
        if game_state.get_story_flag("court_herald_formal_presentation"):
            return ("[character_name]Court Herald[/character_name]: You have been formally presented to the court and "
                    "your credentials are on record. You may access the historical archives and speak with court "
                    "historians about your research.")
        else:
            return ("[character_name]Court Herald[/character_name]: I handle formal presentations and credentials for "
                    "court access. If you wish to research in the historical archives or speak with court officials, "
                    "you'll need proper documentation of your standing.")