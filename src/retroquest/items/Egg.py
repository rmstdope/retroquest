from ..items.Item import Item

class Egg(Item):
    def __init__(self) -> None:
        super().__init__(
            name="egg",
            description="A freshly laid egg, still warm. It could be cooked or used in a recipe."
        )
