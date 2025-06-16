from ..items.Item import Item

class Matches(Item):
    def __init__(self) -> None:
        super().__init__(
            name="matches",
            description="A small box of matches. Useful for lighting fires, candles, or lanterns.",
            can_be_carried=True
        )
