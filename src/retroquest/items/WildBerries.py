from ..items.Item import Item

class WildBerries(Item):
    def __init__(self) -> None:
        super().__init__(
            name="wild berries",
            description="A handful of small, juicy berries. They look edible, but you can't be sure they're safe.",
            short_name="berries",
            can_be_carried=True
        )
