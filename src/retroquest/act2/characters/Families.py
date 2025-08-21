from ...engine.Character import Character
from ...engine.GameState import GameState

class Families(Character):
    def __init__(self) -> None:
        super().__init__(
            name="families",
            description="Friendly local families who have lived in Greendale for generations. They know the city's history and are happy to share stories with helpful visitors.",
        )

    def talk(self, game_state: GameState) -> str:
        return ("[character_name]Local Families[/character_name]: Welcome to our neighborhood! It's lovely to meet someone "
                "who takes time to help others. Greendale has a rich history - our families have been here for generations. "
                "The city has always been a place where those with good hearts and magical talents find a home. "
                "We're grateful for folks like you who lend a hand to those in need.")