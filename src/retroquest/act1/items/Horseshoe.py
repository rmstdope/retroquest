from ...GameState import GameState
from ...Item import Item

class Horseshoe(Item):
    def __init__(self) -> None:
        super().__init__(
            name="horseshoe",
            description="A heavy iron horseshoe, slightly bent. It might bring luck or be useful for repairs.",
            can_be_carried=True
        )
