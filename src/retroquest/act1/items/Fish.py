from ...engine.GameState import GameState
from ...engine.Item import Item

class Fish(Item):
    def __init__(self):
        super().__init__(
            name="fish",
            description="A plump river fish. It looks fresh and would make a good meal or perhaps a gift.",
            can_be_carried=True
        )
