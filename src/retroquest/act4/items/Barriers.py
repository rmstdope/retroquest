"""Barriers - magical barriers blocking the fortress entrance."""

from ...engine.Item import Item
from ...engine.GameState import GameState
from ..Act4StoryFlags import FLAG_ACT4_BARRIERS_DISABLED


class Barriers(Item):
    """Magical barriers of dark energy blocking the fortress entrances."""

    def __init__(self) -> None:
        """Initialize the Barriers."""
        super().__init__(
            name="Barriers",
            description=(
                "Shimmering barriers of dark energy block the entrances to the "
                "fortress. The barriers pulse in rhythm with the ward stones, "
                "drawing power from their dark magic."
            ),
            can_be_carried=False
        )

    def examine(self, game_state: GameState) -> str:
        """Examine the barriers."""
        if not game_state.get_story_flag(FLAG_ACT4_BARRIERS_DISABLED):
            return (
                "[event]Shimmering barriers of dark energy block the entrances to the "
                "fortress. The barriers pulse in rhythm with the ward stones, drawing "
                "power from their dark magic.[/event]"
            )
        else:
            return (
                "[info]The magical barriers have been disabled and no longer block your way.[/info]"
            )
