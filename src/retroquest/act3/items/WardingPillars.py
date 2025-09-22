"""Warding Pillars item for Act III."""

from ...engine.GameState import GameState
from ...engine.Item import Item


class WardingPillars(Item):
    """Tideward ritual pillars requiring purification (Act III).

    Narrative Role:
        Environmental anchor for sigil completion; demonstrates interaction between spell 
        effects and quest progression.

    Key Mechanics:
        `purify()` method transitions state, affecting examine text and enabling downstream
        interactions.
    """
    def __init__(self) -> None:
        """Initialize Warding Pillars with description and purified state."""
        super().__init__(
            name="Warding Pillars",
            description=(
                "Three weathered pillars ring a drowned courtyard; glyph-lines are "
                "clogged with brine and coral crust that must be cleared to restore "
                "their ward function."
            ),
            short_name="warding pillars",
            can_be_carried=False,
        )
        self.purified: bool = False

    def prevent_pickup(self):
        """Prevent pickup of the immovable warding pillars."""
        return (
            "[failure]You can't take the [item_name]Warding Pillars[/item_name]. They are "
            "fixed stone, older than the pier.[/failure]"
        )

    def examine(self, _game_state: GameState) -> str:
        """Examine the warding pillars showing their current purification state."""
        state = "cleansed" if self.purified else "encrusted"
        return (
            f"[event]The pillars stand weathered and {state}. Channels for a "
            "tideward sigil thread their faces; with proper cleansing and coquina "
            "tiles, the ward could be restored.[/event]"
        )

    def purify(self, _game_state: GameState) -> str:
        """Purify the pillars, enabling their use in the Tideward Sigil quest."""
        if self.purified:
            return "[info]The pillars are already cleansed of brine and coral.[/info]"
        self.purified = True
        return (
            "[event]You rinse salt and scrape coral from the carved channels. Glyph-lines "
            "breathe again, ready to take the Tideward Sigil.[/event]"
        )
