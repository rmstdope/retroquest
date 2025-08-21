from ...engine.Character import Character
from ...engine.GameState import GameState

class TownCrier(Character):
    def __init__(self) -> None:
        super().__init__(
            name="town crier",
            description="A loud, enthusiastic man dressed in official Greendale colors who announces news and events throughout the city. He carries a brass bell and scroll with current announcements.",
        )

    def talk(self, game_state: GameState) -> str:
        return ("[character_name]Town Crier[/character_name]: Hear ye, hear ye! Welcome to Greendale, traveler! "
                "The great [character_name]Sir Cedric[/character_name] seeks brave souls to aid in important matters. "
                "If you're looking for adventure and the chance to serve the realm, head to the castle! "
                "Also, don't forget to check the notice board for other opportunities!")