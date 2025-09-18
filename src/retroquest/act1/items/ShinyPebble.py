"""ShinyPebble Item

Narrative Role:
Minor collectible / curiosity reinforcing tactile environmental detail. Potential future token for barter, child NPC interaction, or simple luck charm crafting.

Key Mechanics / Interactions:
- Purely flavor at present; portable and inert.

Story Flags (Sets / Reads):
(none)

Progression Effects:
- Encourages players to pick up innocuous objects, building pattern recognition for later meaningful small finds.

Design Notes:
- Could later influence a luck mechanic or be exchangeable for information.

"""

from ...engine.Item import Item

class ShinyPebble(Item):
    def __init__(self) -> None:
        super().__init__(
            name="shiny pebble",
            description="A small, smooth pebble that glints in the sunlight. It feels oddly warm to the touch.",
            short_name="pebble",
            can_be_carried=True
        )
