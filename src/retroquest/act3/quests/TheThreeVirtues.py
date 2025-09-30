"""The Three Virtues quest class."""

from ...engine.GameState import GameState
from ...engine.Quest import Quest
from ..Act3StoryFlags import (
    FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED,
    FLAG_ACT3_MAIN_COMPLETED,
    FLAG_ACT3_MAIN_STARTED,
)


class TheThreeVirtuesQuest(Quest):
    """Quest to prove Courage, Wisdom, and Selflessness to unlock the final ritual."""
    def __init__(self) -> None:
        """Initialize The Three Virtues quest with description."""
        super().__init__(
            name="The Three Virtues",
            description=(
                "Prove Courage, Wisdom, and Selflessness by recovering the three relics: "
                "the Crystal of Light, the Phoenix Feather, and the Dragon's Scale."
            ),
        )
        self._flag_state = {}

    def is_main(self) -> bool:
        """Return True as this is the main quest for Act III."""
        return True

    def check_trigger(self, game_state: GameState) -> bool:
        """Check if quest should trigger when Mira starts the main plan."""
        # Trigger when Mira has started the main plan in Act III
        return game_state.get_story_flag(FLAG_ACT3_MAIN_STARTED)

    def check_update(self, game_state: GameState) -> bool:
        updated = False
        self.description = ''
        new_desc = (
                "Prove Courage, Wisdom, and Selflessness by recovering the three relics: "
                "the Crystal of Light, the Phoenix Feather, and the Dragon's Scale."
        )
        if game_state.get_story_flag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED):
            if not self._flag_state.get(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED):
                self._flag_state[FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED] = True
                updated = True
            self.description += '[dim]' + new_desc + '[/dim]'
            new_desc = (
                "\n\nYou have claimed the Crystal of Light; its steady brilliance answers "
                "your courage and steadies what the deep waters once denied. Sir "
                "Cedric bids you to press on—dark forces gather, and he needs allies "
                "skilled in magic to stand with him when the hour comes. "
            )
        self.description += new_desc
        return updated

    def check_completion(self, game_state: GameState) -> bool:
        """Check if quest is completed when Act 3 main completion flag is set."""
        # Completes when Act 3 main completed flag set elsewhere (e.g., after Warding Rite)
        return game_state.get_story_flag(FLAG_ACT3_MAIN_COMPLETED)
