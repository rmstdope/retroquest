from ...engine.GameState import GameState
from ...engine.Item import Item

class EntryPass(Item):
    def __init__(self) -> None:
        super().__init__(
            name="entry pass",
            short_name="pass",
            description="An official-looking document with the seal of Greendale. It appears to grant passage through the city gates to those who present it to the guards.",
            can_be_carried=True,
        )

    def use(self, game_state: GameState) -> str:
        return "You examine the entry pass. The seal looks authentic, and it should allow you passage into Greendale without question."
