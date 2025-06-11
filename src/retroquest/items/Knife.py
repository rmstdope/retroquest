from .Item import Item

class Knife(Item):
    def __init__(self) -> None:
        super().__init__(
            name="knife (dull)",
            description="A small kitchen knife with a dull blade. It won't cut much, but could be sharpened.",
            short_name="knife",
            can_be_carried=True
        )
