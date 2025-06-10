from ..items.Item import Item

class AncientAmulet(Item):
    def __init__(self) -> None:
        super().__init__(
            name="ancient amulet",
            description="A mysterious amulet inscribed with runes. It glows faintly and feels powerful to the touch.",
            short_name="amulet"
        )
