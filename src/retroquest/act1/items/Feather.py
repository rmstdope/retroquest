from ...engine.GameState import GameState
from ...engine.Item import Item

class Feather(Item):
    def __init__(self) -> None:
        super().__init__(
            name="feather",
            description="A soft white feather, likely from one of the chickens. It could be used for writing, crafting, or tickling.",
            can_be_carried=True
        )
