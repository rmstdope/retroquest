from ...engine.Room import Room

class MerchantsWarehouse(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Merchant's Warehouse",
            description=(
                "A large stone building filled with goods from distant lands. Crates and barrels are stacked high, "
                "creating narrow passages between towering shelves. The air smells of exotic spices and foreign crafts. "
                "This is where Greendale's merchants store their most valuable inventory."
            ),
            items=[],
            characters=[],
            exits={"north": "MarketDistrict"}
        )
