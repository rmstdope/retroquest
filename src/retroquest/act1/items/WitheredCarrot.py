"""WitheredCarrot Item

Narrative Role:
Demonstrates transformable resource states (withered → fresh) hinting at restorative or nurturing mechanics the player may later unlock.

Key Mechanics / Interactions:
- Starts as a low-value, withered vegetable (`name='withered carrot'`).
- `revive()` method upgrades it to a `fresh carrot` with new description (no external trigger implemented yet).

Story Flags (Sets / Reads):
(none) – Pure item-local state change.

Progression Effects:
- Establishes pattern for environmental or alchemical improvement of gathered resources.

Design Notes:
- Currently unused `revive()` relies purely on caller invocation; later could be tied to a spell, fertilizer room effect, or NPC interaction.
- Keeps `short_name` stable (`carrot`) for command consistency across states.

"""

from ...engine.Item import Item

class WitheredCarrot(Item):
    def __init__(self) -> None:
        super().__init__(
            name="withered carrot",
            description="A shriveled, orange carrot barely clinging to life. It looks edible, but only just.",
            short_name="carrot",
            can_be_carried=True # Withered carrots should be carriable
        )

    def revive(self) -> str:
        self.name = "fresh carrot"
        self.short_name = "carrot" # Keep short_name consistent or update if needed
        self.description = "A vibrant, healthy carrot, freshly revived. It looks delicious and full of nutrients."
        return f"The [item_name]{self.name.lower()}[/item_name] looks vibrant and healthy!"
