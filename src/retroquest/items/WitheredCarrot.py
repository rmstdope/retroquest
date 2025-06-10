from ..items.Item import Item

class WitheredCarrot(Item):
    def __init__(self) -> None:
        super().__init__(
            name="withered carrot",
            description="A shriveled, orange carrot barely clinging to life. It looks edible, but only just.",
            short_name="carrot"
        )
