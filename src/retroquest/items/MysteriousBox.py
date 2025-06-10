from ..items.Item import Item

class MysteriousBox(Item):
    def __init__(self) -> None:
        super().__init__(
            name="mysterious box",
            description="A small, ornate wooden box covered in strange runes. The lid is tightly shut, and it feels oddly heavy for its size. You sense something important is hidden inside.",
            short_name="box"
        )
