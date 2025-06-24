from ...GameState import GameState

from ...Item import Item

class DullKnife(Item):
    def __init__(self) -> None:
        super().__init__(
            name="dull knife",
            description="A small kitchen knife with a dull blade. It won't cut much, but could be sharpened.",
            short_name="knife",
            can_be_carried=True
        )
