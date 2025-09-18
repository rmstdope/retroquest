"""Merchant's Warehouse (Act II)

Narrative Role:
    Storage adjunct to MarketDistrict emphasizing trade network scale and providing potential staging area for future supply or theft quests.

Key Mechanics:
    - Static room with no dynamic interactions presently.

Story Flags:
    - None (candidate location for smuggling/stock audit flags later).

Contents:
    - Currently empty lists (items/characters) to keep space flexible for quest injection.

Design Notes:
    - Serves as environmental world-building; minimal implementation keeps maintenance cost low until narrative demands complexity.
"""

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
