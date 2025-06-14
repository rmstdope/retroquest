from ..items.Item import Item

class ShinyPebble(Item):
    def __init__(self) -> None:
        super().__init__(
            name="shiny pebble",
            description="A small, smooth pebble that glints in the sunlight. It feels oddly warm to the touch.",
            short_name="pebble"
        )
