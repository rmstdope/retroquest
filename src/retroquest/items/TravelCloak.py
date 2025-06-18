from ..items.Item import Item

class TravelCloak(Item):
    def __init__(self) -> None:
        super().__init__(
            name="travel cloak",
            description="A heavy, hooded cloak made for travel. It offers warmth and protection from the elements.",
            short_name="cloak",
            can_be_carried=True
        )
