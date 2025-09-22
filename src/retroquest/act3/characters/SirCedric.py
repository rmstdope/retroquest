"""Sir Cedric character for Act 3."""

from ...engine.Character import Character
from ...engine.GameState import GameState
from ..Act3StoryFlags import FLAG_ACT3_MAIN_STARTED


class SirCedric(Character):
    """A steadfast knight who aids the player in their quest against Malakar."""
    def __init__(self) -> None:
        """Initialize Sir Cedric with description."""
        super().__init__(
            name="sir cedric",
            description=(
                "Armor tempered, eyes steady—Cedric stands ready for the trials. "
                "His presence is a quiet promise."
            ),
        )

    def talk_to(self, game_state: GameState) -> str:
        """Return appropriate dialogue based on quest progress."""
        if game_state.get_story_flag(FLAG_ACT3_MAIN_STARTED):
            return (
                "[character_name]Sir Cedric[/character_name]: The path is set. "
                "Courage, Wisdom, Selflessness—name them with your deeds, and we "
                "will see this through."
            )
        else:
            return (
                "[character_name]Sir Cedric[/character_name]: If we're to take the "
                "fight to Malakar, speak with [character_name]Mira[/character_name]. "
                "She understands the rites and the way to begin."
            )
