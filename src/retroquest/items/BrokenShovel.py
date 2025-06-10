from ..items.Item import Item

class BrokenShovel(Item):
    def __init__(self) -> None:
        super().__init__(
            name="broken shovel",
            description="A rusty, splintered shovel with a cracked wooden handle. It looks like it hasn't been used in years, but might still be useful for digging in soft earth.",
            short_name="shovel"
        )
