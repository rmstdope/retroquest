from ...GameState import GameState
from ...Item import Item

class Rope(Item):
    def __init__(self) -> None:
        super().__init__(
            name="rope",
            description="A long, sturdy coil of rope. Useful for climbing, tying, or hauling things."
        )
    def use_with(self, game_state, other_item: Item) -> str:
        from .Mechanism import Mechanism
        if isinstance(other_item, Mechanism):
            # Delegate to the Mechanism's use_with method
            return other_item.use_with(game_state, self)
        return super().use_with(game_state, other_item)
