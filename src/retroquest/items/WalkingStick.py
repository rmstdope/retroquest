from ..items.Item import Item

class WalkingStick(Item):
    def __init__(self) -> None:
        super().__init__(
            name="walking stick",
            description="A sturdy wooden stick, perfect for long journeys or fending off wild animals.",
            short_name="stick",
            can_be_carried=True  # Walking sticks should be carriable
        )
