"""Tideward Sigils quest class."""

from ...engine.GameState import GameState
from ...engine.Quest import Quest
from ..Act3StoryFlags import FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED

#TODO Rework how the quest is activated
class TidewardSigilsQuest(Quest):
    """Quest to stabilize flood wards by engraving Tideward Sigils."""
    def __init__(self) -> None:
        """Initialize Tideward Sigils quest with description."""
        super().__init__(
            name="Tideward Sigils",
            description=(
                "Ancient warding pillars stand along the drowned causeway — relics of "
                "coastal rites that once bent the tides to human will. You must cleanse "
                "and activate them by engraving a full Moon Sigil to steady the flood "
                "wards and gain safe passage to the sanctum."
            ),
            completion=(
                "You cleansed the pillars and set the Moon Rune shards—the Moon "
                "Sigil resonates and the flood wards steady, granting safe passage "
                "toward the sanctum."
            ),
        )

    def check_trigger(self, game_state: GameState) -> bool:
        """Check if quest should trigger when reaching Shoreline Markers."""
        # Activate when first reaching the Shoreline Markers in the Sunken Ruins
        return game_state.current_room.name == "Shoreline Markers"

    def check_completion(self, game_state: GameState) -> bool:
        """Check if quest is completed based on sigils being completed."""
        return game_state.get_story_flag(FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED)
