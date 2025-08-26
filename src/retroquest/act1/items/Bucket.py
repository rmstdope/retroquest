from ...engine.GameState import GameState
from .Well import Well
from ...engine.Item import Item

class Bucket(Item):
    def __init__(self) -> None:
        super().__init__(
            name="bucket",
            description="A sturdy wooden bucket with a rope handle. It's perfect for drawing water from a well or carrying supplies.",
            can_be_carried=True
        )

    def use_with(self, game_state: GameState, target: Item) -> str:
        if isinstance(target, Well):
            if self.name == "bucket": # Check if it's not already full
                self.name = "bucket (full)"
                self.description = "TA sturdy wooden bucket with a rope handle. It is full of water from the well."
                # Potentially, we could also add a story flag or a specific state to the bucket itself
                # e.g., self.set_property("is_full", True) if we had such a system in Item.
                return "[event]You lower the [item_name]bucket[/item_name] into the [item_name]well[/item_name] and draw it up, full of clear water.[/event]"
            else:
                return "[failure]The [item_name]bucket[/item_name] is already full.[/failure]"
        else:
            return f"[failure]You can't seem to use the [item_name]bucket[/item_name] together with [item_name]{target.get_name()}[/item_name]. Perhaps near something with water?[/failure]"
