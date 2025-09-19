"""Carved niche for mounting prism lanterns."""
from ...engine.Item import Item
from ...engine.GameState import GameState


class LanternBracket(Item):
    """
    A fixed mounting point for prism lanterns in ritual spaces.
    
    Narrative Role:
    - Architectural element that provides structure for lighting rituals
    - Visual cue for prism lantern placement during ceremonies
    - Static anchor point that players can reference for spatial orientation
    
    Key Mechanics:
    - Cannot be carried (fixed architectural element)
    - Tracks whether a lantern is currently mounted
    - Examine text changes based on lantern presence
    """
    def __init__(self) -> None:
        super().__init__(
            name="Lantern Bracket",
            description=(
                "A carved niche fitted with a brass bracket, sized for a prism lantern."
            ),
            short_name="bracket",
            can_be_carried=False,
        )
        self.has_lantern: bool = False

    def examine(self, _game_state: GameState) -> str:
        """Override examine to report current lantern status."""
        if self.has_lantern:
            return "A prism lantern rests here, ready to be lit."
        return "An empty bracket waits for a lantern."
