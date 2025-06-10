from ..items.Item import Item

class SmoothStone(Item):
    def __init__(self) -> None:
        super().__init__(
            name="smooth stone",
            description="A small, flat stone polished smooth by the river's current. It fits perfectly in your palm.",
            short_name="stone"
        )
