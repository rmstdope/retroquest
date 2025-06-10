from ..items.Item import Item

class FishingRod(Item):
    def __init__(self) -> None:
        super().__init__(
            name="fishing rod",
            description="A simple wooden fishing rod with a frayed line. It looks well-used but still functional.",
            short_name="rod"
        )
