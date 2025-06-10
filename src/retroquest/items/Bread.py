from ..items.Item import Item

class Bread(Item):
    def __init__(self) -> None:
        super().__init__(
            name="bread",
            description="A small loaf of fresh, crusty bread. It smells delicious and could restore a bit of energy."
        )
