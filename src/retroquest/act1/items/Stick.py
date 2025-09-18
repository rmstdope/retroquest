"""Stick Item

Narrative Role:
Common salvage output (e.g., from clearing vines) offering low-tier improvisational utility and combination potential.

Key Mechanics / Interactions:
- Delegates combination to `MagneticFishingRod` when paired, enabling that item to centralize retrieval logic.

Story Flags (Sets / Reads):
(none)

Progression Effects:
- Reinforces that mundane objects may still participate in crafted tool chains.

Design Notes:
- Could later be upcycled into more advanced tools (staff, spear) if crafting deepens.

"""

from ...engine.Item import Item

class Stick(Item):
    def __init__(self) -> None:
        super().__init__(
            name="stick",
            description="A sturdy stick, perfect for walking, poking, or perhaps as a makeshift weapon.",
            can_be_carried=True,
        )

    def use_with(self, game_state, other_item: Item) -> str:
        # If the other item is a MagneticFishingRod, delegate to its use_with
        from .MagneticFishingRod import MagneticFishingRod
        if isinstance(other_item, MagneticFishingRod):
            return other_item.use_with(game_state, self)
        return super().use_with(game_state, other_item)
