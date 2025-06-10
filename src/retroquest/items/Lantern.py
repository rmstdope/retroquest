from ..items.Item import Item

class Lantern(Item):
    def __init__(self) -> None:
        super().__init__(
            name="lantern",
            description="A well-used brass lantern. Its glass is clean and the wick is fresh, ready to light up the darkest corners."
        )
