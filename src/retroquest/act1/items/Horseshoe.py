"""Horseshoe Item

Narrative Role:
Evokes pastoral setting and folk belief in luck. Serves as a sturdy metal artifact for potential repair, warding, or trade quests.

Key Mechanics / Interactions:
- Currently inert flavor; portable.

Story Flags (Sets / Reads):
(none)

Progression Effects:
- Seeds expectation of future crafting/repair system or superstition-based interactions.

Design Notes:
- Could later mount above a doorway to set a protective flag or be combined with smithing tools.

"""

from ...engine.Item import Item

class Horseshoe(Item):
    def __init__(self) -> None:
        super().__init__(
            name="horseshoe",
            description="A heavy iron horseshoe, slightly bent. It might bring luck or be useful for repairs.",
            can_be_carried=True
        )
