from ...engine.GameState import GameState
from ...engine.Item import Item

class Magnet(Item):
    def __init__(self):
        super().__init__(
            name="magnet",
            description="A small, surprisingly strong magnet. It might be useful for retrieving metallic objects from hard-to-reach places.",
            can_be_carried=True
        )

    def use_with(self, game_state: GameState, other_item: Item) -> str:
        from .FishingRod import FishingRod
        if isinstance(other_item, FishingRod):
            # Delegate to FishingRod's use_with
            return other_item.use_with(game_state, self)
        return super().use_with(game_state, other_item)
