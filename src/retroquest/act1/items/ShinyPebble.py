from ...engine.GameState import GameState
from ...engine.Item import Item

class ShinyPebble(Item):
    def __init__(self) -> None:
        super().__init__(
            name="shiny pebble",
            description="A small, smooth pebble that glints in the sunlight. It feels oddly warm to the touch.",
            short_name="pebble",
            can_be_carried=True
        )
