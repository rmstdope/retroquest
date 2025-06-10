from ..items.Item import Item

class Stick(Item):
    def __init__(self) -> None:
        super().__init__(
            name="stick",
            description="A sturdy stick, perfect for walking, poking, or perhaps as a makeshift weapon."
        )
