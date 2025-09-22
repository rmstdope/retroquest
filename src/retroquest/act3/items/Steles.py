"""Weathered stone pillars containing coquina runes for tidebound sigils."""
from ...engine.GameState import GameState
from ...engine.Item import Item


class Steles(Item):
    """
    Ancient stone pillars at the shore's edge with ward sigils.

    Narrative Role:
    - Source of coquina fragments needed for tidebound ritual work
    - Visual markers of the shore's magical foundation
    - Immovable landmarks that ground the scene in ancient power

    Key Mechanics:
    - Cannot be picked up (part of the shore itself)
    - Examine reveals coquina fragments useful for sigil completion
    - Contains narrative hints about ward magic and tidebound rituals
    """
    def __init__(self) -> None:
        """Initialize Steles with description and properties."""
        super().__init__(
            name="Steles",
            description=(
                "Weathered stone pillars at the surf's edge. Coquina carvings trace "
                "ward sigils beneath coral crust."
            ),
            short_name="steles",
            can_be_carried=False,
        )

    def prevent_pickup(self):
        """Override pickup prevention with context-specific message."""
        return (
            "[failure]You can't take the [item_name]Steles[/item_name]. They are part "
            "of the shore itself—heavy and set.[/failure]"
        )

    def examine(self, _game_state: GameState) -> str:
        """Override examine with detailed description of coquina carvings and fragments."""
        return (
            "[event]The steles are carved from coquina, their pores packed with salt. "
            "Runes repeat in a pattern that suggests warding. Loose fragments glint in "
            "crevices—useful for completing tidebound sigils.[/event]"
        )
