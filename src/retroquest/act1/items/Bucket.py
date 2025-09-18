"""Bucket Item

Narrative Role:
Early utility container that teaches players about combining items with environmental features. Drawing water is a simple formative interaction reinforcing examination and experimentation in Act I.

Key Mechanics / Interactions:
- Can be used with the `well` (the `Well` item) to obtain a filled variant (renames itself to ``bucket (full)``) the first time it is used while empty.
- Idempotent fill: attempting to fill an already full bucket returns a failure message without changing state.
- Potential future hook for water-based progression (e.g., dousing fire, softening soil) via state check on name or added property.

Story Flags (Sets / Reads):
(none) – Current implementation relies only on item-local state (its name) rather than global story flags.

Progression Effects:
- Introduces dynamic item state changes (renaming) early in the game loop.
- May be leveraged later for light environmental puzzles; presently self-contained.

Design Notes:
- Uses name mutation instead of a separate boolean property to mark fullness to keep engine changes minimal.
- If expanded, prefer adding an explicit property (e.g., ``set_property('is_full', True)``) for clarity rather than parsing the name.
- Retains carry status after filling (no weight system implemented yet).

"""

from ...engine.GameState import GameState
from .Well import Well
from ...engine.Item import Item

class Bucket(Item):
    def __init__(self) -> None:
        super().__init__(
            name="bucket",
            description="A sturdy wooden bucket with a rope handle. It's perfect for drawing water from a well or carrying supplies.",
            can_be_carried=True
        )

    def use_with(self, game_state: GameState, other_item: Item) -> str:
        if isinstance(other_item, Well):
            if self.name == "bucket": # Check if it's not already full
                self.name = "bucket (full)"
                self.description = "A sturdy wooden bucket with a rope handle. It is full of clear water drawn from the well."
                # Potentially, we could also add a story flag or a specific state to the bucket itself
                # e.g., self.set_property("is_full", True) if we had such a system in Item.
                return "[event]You lower the [item_name]bucket[/item_name] into the [item_name]well[/item_name] and draw it up, full of clear water.[/event]"
            else:
                return "[failure]The [item_name]bucket[/item_name] is already full.[/failure]"
        else:
            return f"[failure]You can't seem to use the [item_name]bucket[/item_name] together with [item_name]{other_item.get_name()}[/item_name]. Perhaps near something with water?[/failure]"
