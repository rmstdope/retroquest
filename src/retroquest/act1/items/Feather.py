"""Feather Item

Narrative Role:
Lightweight byproduct item suggesting crafting (quills, fletching) or ritual uses yet to be unlocked.

Key Mechanics / Interactions:
- Portable flavor/crafting candidate; no active verbs implemented.

Story Flags (Sets / Reads):
(none)

Progression Effects:
- Seeds player expectation of a future crafting or inscription system.

Design Notes:
- Potential synergy with ink, parchment, or arrow shaft items later.

"""

from ...engine.Item import Item

class Feather(Item):
    """
    Lightweight byproduct item suggesting crafting or ritual uses yet to be unlocked.
    """

    def __init__(self) -> None:
        """Initialize the Feather item with name, description, and carry status."""
        super().__init__(
            name="feather",
            description=(
                "A soft white feather, likely from one of the chickens. It could be used for "
                "writing, crafting, or tickling."
            ),
            can_be_carried=True
        )
