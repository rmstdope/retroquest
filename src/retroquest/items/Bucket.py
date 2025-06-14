from ..GameState import GameState
from .Well import Well
from .Item import Item

class Bucket(Item):
    def __init__(self) -> None:
        super().__init__(
            name="bucket",
            description="A sturdy wooden bucket with a rope handle. It's perfect for drawing water from a well or carrying supplies.",
            can_be_carried=True
        )

    def use_with(self, game_state: GameState, target: Item):
        if isinstance(target, Well):
            if self.name == "bucket": # Check if it's not already full
                self.name = "bucket (full)"
                self.description = "The bucket is now full of clear water from the well."
                # Potentially, we could also add a story flag or a specific state to the bucket itself
                # e.g., self.set_property("is_full", True) if we had such a system in Item.
                return "You lower the bucket into the well and draw it up, full of clear water."
            else:
                return "The bucket is already full."
        else:
            return "You can't seem to use the bucket that way here. Perhaps near something with water?"
