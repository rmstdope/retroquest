"""WildBerries Item

Narrative Role:
Foraged food source that introduces risk/uncertainty concept (appearance vs. safety). Potential ingredient for future alchemy or cooking.

Key Mechanics / Interactions:
- Currently inert, portable resource.
- Often spawned via `Bush.grow` spell interaction.

Story Flags (Sets / Reads):
(none)

Progression Effects:
- Reinforces magical influence over environment (harvest enabling spell).

Design Notes:
- Could later add identification or toxicity system requiring knowledge flags.

"""

from ...engine.Item import Item

class WildBerries(Item):
    def __init__(self) -> None:
        super().__init__(
            name="wild berries",
            description="A handful of small, juicy berries. They look edible, but you can't be sure they're safe.",
            short_name="berries",
            can_be_carried=True
        )
