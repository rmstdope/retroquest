from ..items.Item import Item

class Bucket(Item):
    def __init__(self) -> None:
        super().__init__(
            name="bucket",
            description="A sturdy wooden bucket with a rope handle. It's perfect for drawing water from a well or carrying supplies.",
            can_be_carried=True
        )
