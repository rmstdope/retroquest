from ...engine.GameState import GameState
from ...engine.Item import Item

class Stick(Item):
    def __init__(self) -> None:
        super().__init__(
            name="stick",
            description="A sturdy stick, perfect for walking, poking, or perhaps as a makeshift weapon.",
            can_be_carried=True,
        )

    def use_with(self, game_state, other_item: Item) -> str:
        # If the other item is a MagneticFishingRod, delegate to its use_with
        from .MagneticFishingRod import MagneticFishingRod
        if isinstance(other_item, MagneticFishingRod):
            return other_item.use_with(game_state, self)
        return super().use_with(game_state, other_item)
