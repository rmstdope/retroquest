"""Rope Item

Narrative Role:
Found/purchased early; establishes that some shop items must be paid for before pickup. Serves as a generic enabling tool for later mechanical or traversal interactions.

Key Mechanics / Interactions:
- Pickup may be blocked by the shopkeeper until purchased (`prevent_pickup`).
- Delegates combo logic when used with a `Mechanism` object (``Mechanism.use_with(game_state, rope)``) – keeps specific puzzle logic centralized in the target.
- Otherwise falls back to base `Item.use_with` behavior.

Story Flags (Sets / Reads):
(none) – Economic gating implied via `can_be_carried_flag` rather than flags.

Progression Effects:
- Teaches player that not all visible items are freely obtainable.
- Acts as a future-proof generic component for multi-step contraptions or rescue events (parallel to Act II higher-quality rope patterns).

Design Notes:
- Uses a defensive late import for `Mechanism` to avoid circular dependencies.
- Expansion path: could add durability or consumption on certain high-impact uses without refactoring current API.

"""

from ...engine.Item import Item

class Rope(Item):
    def __init__(self) -> None:
        super().__init__(
            name="rope",
            description="A long, sturdy coil of rope. Useful for climbing, tying, or hauling things."
        )
    
    def prevent_pickup(self) -> str | None:
        """Shopkeeper prevents taking the rope unless it's been purchased."""
        if not self.can_be_carried_flag:
            return f"[character_name]Shopkeeper[/character_name] quickly steps over. [dialogue]'Hold on there, friend! That [item_name]{self.get_name()}[/item_name] is merchandise, not a free sample. If you want it, you'll need to buy it proper-like.'[/dialogue]"
        return None  # Allow pickup if can_be_carried is True
    
    def use_with(self, game_state, other_item: Item) -> str:
        from .Mechanism import Mechanism
        if isinstance(other_item, Mechanism):
            # Delegate to the Mechanism's use_with method
            return other_item.use_with(game_state, self)
        return super().use_with(game_state, other_item)
