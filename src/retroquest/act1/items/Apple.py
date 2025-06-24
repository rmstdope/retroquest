from ...engine.GameState import GameState
from ...engine.Item import Item

class Apple(Item):
    def __init__(self) -> None:
        super().__init__(
            name="apple",
            description="A crisp, red apple. It looks fresh and delicious, perfect for a quick snack."
        )
