"""OldOathScrolls item for the Dragon's Hall in Act 3."""
from ...engine.Item import Item
from ...engine.GameState import GameState
from ..Act3StoryFlags import FLAG_ACT3_OATH_SCROLLS_EXAMINED


class OldOathScrolls(Item):
    """Ancient scrolls containing binding oaths from ages past."""

    def __init__(self) -> None:
        """Initialize OldOathScrolls as a collectible item."""
        super().__init__(
            name="old oath scrolls",
            description=(
                "Weathered parchment scrolls bound with golden thread that shimmer with "
                "an inner light, inscribed with sacred vows and solemn pledges in "
                "languages both ancient and forgotten. The archaic script speaks of "
                "binding oaths that must be spoken with absolute sincerity to prove "
                "one's true selflessness—words that can only be uttered by those who "
                "have demonstrated genuine sacrifice for others without thought of "
                "personal gain. The mystical texts describe how the Ancient Dragon "
                "judges the hearts of supplicants, requiring them to speak an oath "
                "that resonates with their deepest nature and purest intentions. Each "
                "syllable pulses faintly with residual magic, as if the very essence "
                "of countless noble souls who have spoken these words still lingers "
                "within the parchment, waiting to recognize a kindred spirit worthy "
                "of the dragon's trust and wisdom."
            ),
            can_be_carried=True
        )

    def examine(self, game_state: GameState) -> str:
        """Examine the oath scrolls and set the examined flag."""
        game_state.set_story_flag(FLAG_ACT3_OATH_SCROLLS_EXAMINED, True)
        return super().examine(game_state)
