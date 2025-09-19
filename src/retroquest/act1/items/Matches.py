"""Matches Item

Narrative Role:
    Basic ignition source enabling illumination and ritual flavor actions (e.g., lighting
    candles or a lantern). Reinforces delegated interaction pattern with target items.

Key Mechanics / Interactions:
    - Pickup can be blocked by the shopkeeper until purchased (``prevent_pickup``).
    - When used with a ``Candle``, delegates logic to the candle's ``use_with`` so the candle
      controls its lit state and side effects.
    - Otherwise defers to base combination handling.

Story Flags (Sets / Reads):
    (none) – lighting actions currently self-contained.

Progression Effects:
    - Shows that enabling tools (like matches) unlock latent states in other items (candles,
      lanterns) rather than doing something standalone.

Design Notes:
    - Could be extended with limited charges (match count) if resource management arrives.
    - Simplicity preserved by not tracking a lit state itself; targets own their ignition state.
"""

from ...engine.Item import Item
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from ...engine.GameState import GameState

class Matches(Item):
    """
    Basic ignition source enabling illumination and ritual flavor actions.
    """

    def __init__(self) -> None:
        """Initialize the Matches item with name and description."""
        super().__init__(
            name="matches",
            description=(
                "A small box of matches. Useful for lighting fires, candles, or lanterns."
            ),
        )

    def prevent_pickup(self) -> str | None:
        """Shopkeeper prevents taking the matches unless they've been purchased."""
        if not self.can_be_carried_flag:
            return (
                "[character_name]Shopkeeper[/character_name] quickly steps over. "
                "[dialogue]'Hold on there, friend! That "
                f"[item_name]{self.get_name()}[/item_name] is merchandise, not a free sample. "
                "If you want it, you'll need to buy it proper-like.'[/dialogue]"
            )
        return None  # Allow pickup if can_be_carried is True

    def use_with(self, game_state: 'GameState', other_item: Item) -> str:
        """Delegate to Candle's use_with if applicable, otherwise fallback."""
        from .Candle import Candle
        if isinstance(other_item, Candle):
            return other_item.use_with(game_state, self)
        return super().use_with(game_state, other_item)
