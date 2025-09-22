from ...engine.Item import Item
from ...engine.GameState import GameState

class SharpKnife(Item):
    def __init__(self) -> None:
        super().__init__(
            name="sharp knife",
            description="A well-sharpened knife. It looks like it could cut through "
            + "almost anything.",
            short_name="knife",
            can_be_carried=True
        )

    def use_with(self, game_state, other_item: Item) -> str:
        from .Vines import Vines  # Local import for isinstance check
        if isinstance(other_item, Vines):
            return other_item.use_with(game_state, self)
        return super().use_with(game_state, other_item)

