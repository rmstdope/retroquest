from ..items.Item import Item

class OldNotice(Item):
    def __init__(self) -> None:
        super().__init__(
            name="old notice",
            description="A faded piece of parchment pinned to the notice board. The writing is barely legible, but it might contain a clue or warning.",
            short_name="notice"
        )
