"""Sea-Sealed Letter item for Tidal Causeway (Act III)."""

from ...engine.GameState import GameState
from ...engine.Item import Item

class SeaSealedLetter(Item):
    """A scrap of vellum preserved by salt-crystal varnish."""

    def __init__(self) -> None:
        """Initialize the sea-sealed letter with its description."""
        super().__init__(
            name="Sea-Sealed Letter",
            short_name="letter",
            description=(
                "A scrap of vellum preserved by salt-crystal varnish. The ink hints at "
                "names and a warding bargain."
            ),
            can_be_carried=True,
        )

    def picked_up(self, _game_state: GameState) -> str:
        """Handle letter pickup and set story flag."""
        return (
            "[item_effect]You carefully fold the preserved fragment — a testament "
            "kept by the sea.[/item_effect]"
        )
