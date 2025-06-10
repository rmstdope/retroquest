from ..items.Item import Item

class Rope(Item):
    def __init__(self) -> None:
        super().__init__(
            name="rope",
            description="A long, sturdy coil of rope. Useful for climbing, tying, or hauling things."
        )
