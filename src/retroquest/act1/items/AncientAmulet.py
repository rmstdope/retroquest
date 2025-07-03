from ...engine.GameState import GameState

from ...engine.Item import Item

class AncientAmulet(Item):
    def __init__(self) -> None:
        super().__init__(
            name="ancient amulet",
            description="A mysterious amulet inscribed with runes. It glows faintly and feels powerful to the touch.",
            short_name="amulet"
        )
# TODO Mira should say something if Elior tries to take the amulet before the quest is complete
