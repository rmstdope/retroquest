from .Item import Item

class FishingRod(Item):
    def __init__(self) -> None:
        super().__init__(
            name="fishing rod",
            description="A simple wooden fishing rod with a frayed line. It looks well-used but still functional.",
            short_name="rod",
            can_be_carried=True
        )

    def use_with(self, game_state, other_item):
        from .River import River
        if isinstance(other_item, River):
            return other_item.use_with(game_state, self)
        return super().use_with(game_state, other_item)
