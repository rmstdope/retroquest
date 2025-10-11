"""Ward Stones - ancient magical anchors for fortress defenses."""

from ...engine.Item import Item
from ...engine.GameState import GameState


class WardStones(Item):
    """Ancient ward stones that anchor the fortress's magical defenses."""

    def __init__(self) -> None:
        """Initialize the Ward Stones."""
        super().__init__(
            name="Ward Stones",
            description=(
                "Ancient stone pillars carved with protective runes that pulse with "
                "dark energy. These ward stones appear to be the anchor points for "
                "the shadow guardians and magical barriers protecting the fortress."
            ),
            can_be_carried=False
        )

    def examine(self, _game_state: GameState) -> str:
        """Examine the ward stones."""
        return (
            "[event]You examine the ward stones closely. Each stone is carved with "
            "ancient protective runes that pulse with dark energy. The stones appear "
            "to be the anchor points for the shadow guardians and magical barriers. "
            "A fragment has broken off from one stone, perhaps weakening the network.[/event]"
        )
