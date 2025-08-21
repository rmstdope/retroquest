from ...engine.GameState import GameState
from ...engine.Item import Item

class TravelersJournal(Item):
    def __init__(self) -> None:
        super().__init__(
            name="traveler's journal",
            description="A well-worn leather journal containing historical notes, family genealogies, and references to ancient bloodlines. Several passages mention Willowbrook and its significance in regional history.",
            can_be_carried=True,
        )

    def use(self, game_state: GameState) -> str:
        return "You flip through the traveler's journal. The historical references and genealogical information could be valuable for research into your family's heritage and Willowbrook's history."