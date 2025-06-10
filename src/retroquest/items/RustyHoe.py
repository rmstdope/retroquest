from ..items.Item import Item

class RustyHoe(Item):
    def __init__(self) -> None:
        super().__init__(
            name="rusty hoe",
            description="A gardening hoe with a rusted blade and a splintered handle. It might still be useful for tilling soil.",
            short_name="hoe"
        )
