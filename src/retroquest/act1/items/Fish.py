from ...engine.GameState import GameState
from ...engine.Item import Item
from typing import Any

class Fish(Item):
    def __init__(self) -> None:
        super().__init__(
            name="fish",
            description="A plump river fish. It looks fresh and would make a good meal or perhaps a gift.",
            can_be_carried=True
        )
