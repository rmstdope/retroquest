"""Coquina shell runes for tidebound ward sigils."""
from typing import Union

from ...engine.GameState import GameState
from ...engine.Item import Item
from .WardingPillars import WardingPillars


class CoquinaRunes(Item):
    """
    Etched coquina shells used for ward-line restoration.

    Narrative Role:
    - Material component for completing tidebound ward sigils
    - Harvested fragments that connect shore magic to ritual work
    - Tactile element that reinforces the coastal magical tradition

    Key Mechanics:
    - Can be carried as ritual components
    - Interacts with WardingPillars through room-mediated hook system
    - Provides flavor text on pickup (salt residue)
    """
    def __init__(self) -> None:
        """Initialize Coquina Runes with description and properties."""
        super().__init__(
            name="Coquina Runes",
            description=(
                "Porous shells fused into chalk-white tiles, etched with ward-lines "
                "that drink brine and hold it."
            ),
            short_name="coquina runes",
            can_be_carried=True,
        )

    def picked_up(self, _game_state: GameState) -> Union[str, None]:
        """Override pickup to provide tactile flavor text."""
        # Flavor-only for now; side quest logic handled elsewhere
        return "[dim]The runes leave a fine salt on your fingers.[/dim]"

    def use_with(self, game_state: GameState, other_item: 'Item') -> str:
        """Override item interaction, delegating pillar combinations to room hooks."""
        if isinstance(other_item, WardingPillars):
            # Ask the room to handle sigil completion
            hook = getattr(game_state.current_room, 'use_runes_with_pillars', None)
            if hook:
                return hook(game_state)
        return super().use_with(game_state, other_item)
