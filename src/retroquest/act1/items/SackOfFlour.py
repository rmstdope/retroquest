from ...engine.GameState import GameState

from ...engine.Item import Item

class SackOfFlour(Item):
    def __init__(self) -> None:
        super().__init__(
            name="sack of flour",
            description="A heavy burlap sack filled with fine white flour. Essential for baking, but a bit unwieldy to carry.",
            short_name="flour"
        )
