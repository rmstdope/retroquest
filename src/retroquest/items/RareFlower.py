from ..items.Item import Item

class RareFlower(Item):
    def __init__(self) -> None:
        super().__init__(
            name="rare flower",
            description="A delicate, radiant flower found only in this hidden glade. Its petals shimmer with a faint magical glow.",
            short_name="flower",
            can_be_carried=True
        )
