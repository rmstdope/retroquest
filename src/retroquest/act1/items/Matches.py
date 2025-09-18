"""Matches Item

Narrative Role:
Basic ignition source enabling illumination and ritual flavor actions (e.g., lighting candles or a lantern). Reinforces delegated interaction pattern with target items.

Key Mechanics / Interactions:
- Pickup can be blocked by the shopkeeper until purchased (`prevent_pickup`).
- When used with a `Candle`, delegates logic to the candle's `use_with`, allowing candle to control its lit state and side effects.
- Otherwise defers to base combination handling.

Story Flags (Sets / Reads):
(none) – Lighting actions currently self-contained.

Progression Effects:
- Establishes that certain enabling tools (like matches) unlock latent states in other items (candles, lanterns) rather than doing something standalone.

Design Notes:
- Could be extended with limited charges (match count) if resource management is introduced.
- Maintains simplicity by not tracking a lit state itself; targets own their ignition state.

"""

from ...engine.Item import Item

class Matches(Item):
    def __init__(self) -> None:
        super().__init__(
            name="matches",
            description="A small box of matches. Useful for lighting fires, candles, or lanterns."
        )

    def prevent_pickup(self) -> str | None:
        """Shopkeeper prevents taking the matches unless they've been purchased."""
        if not self.can_be_carried_flag:
            return f"[character_name]Shopkeeper[/character_name] quickly steps over. [dialogue]'Hold on there, friend! That [item_name]{self.get_name()}[/item_name] is merchandise, not a free sample. If you want it, you'll need to buy it proper-like.'[/dialogue]"
        return None  # Allow pickup if can_be_carried is True

    def use_with(self, game_state, other_item) -> str:
        from .Candle import Candle # Moved import here and updated path
        if isinstance(other_item, Candle):
            # Call the Candle's use_with method, passing these matches
            return other_item.use_with(game_state, self)
        return super().use_with(game_state, other_item)
