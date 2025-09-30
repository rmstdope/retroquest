"""Mirrors of Emberlight side quest for Mount Ember."""

from ...engine.GameState import GameState
from ...engine.Quest import Quest
from ..Act3StoryFlags import (
    FLAG_ACT3_MIRRORS_OF_EMBER_LIGHT_STARTED,
    FLAG_ACT3_MIRRORS_OF_EMBER_LIGHT_COMPLETED
)

class MirrorsOfEmberlightQuest(Quest):
    """Side quest to recover and repair brass mirror segments for Mount Ember.

    Objectives:
    - Recover brass mirror segments from the Obsidian Outcrops.
    - Mount and repair mirrors on the Mirror Terraces to form a continuous
      light channel that opens the way to the Phoenix Crater.
    """

    def __init__(self) -> None:
        """Initialize the quest with a short description."""
        super().__init__(
            name="Mirrors of Emberlight",
            description=(
                "Recover cracked brass mirror segments and repair them on the "
                "Mirror Terraces to form an unbroken light channel to the high "
                "altar."
            ),
        )

    def check_trigger(self, game_state: GameState) -> bool:
        """Trigger when the player first arrives at Mount Ember (Lower Switchbacks).

        This is a lightweight check and may be refined to use a story flag.
        """
        return game_state.get_story_flag(FLAG_ACT3_MIRRORS_OF_EMBER_LIGHT_STARTED)

    def check_completion(self, game_state: GameState) -> bool:
        """Return True when the mirrors have been fully mounted and repaired.

        This implementation uses a conservative threshold of 4 segments as a
        placeholder; the game should set this based on design parameters.
        """
        return game_state.get_story_flag(FLAG_ACT3_MIRRORS_OF_EMBER_LIGHT_COMPLETED)
