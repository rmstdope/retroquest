from ...GameState import GameState

from ...Item import Item

class HealingHerb(Item):
    def __init__(self) -> None:
        super().__init__(
            name="healing herb",
            description="A bundle of fragrant green herbs, known for their restorative properties. Useful for healing wounds or brewing potions.",
            short_name="herb"
        )
