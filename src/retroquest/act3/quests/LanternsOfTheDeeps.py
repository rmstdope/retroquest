"""Lanterns of the Deeps quest class."""

from ...engine.GameState import GameState
from ...engine.Quest import Quest
from ..Act3StoryFlags import FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT, FLAG_ACT3_TIDEWARD_SIGILS_ATTUNED


class LanternsOfTheDeepsQuest(Quest):
    """Side quest: retrieve and mount three prism lanterns, then light them to reveal the path."""

    def __init__(self) -> None:
        super().__init__(
            name="Lanterns of the Deeps",
            description=(
                "Retrieve three prism lanterns from the pier vault and mount them "
                "along the submerged approach. Kindle them to reveal the safe path to the sanctum."
            ),
            completion=(
                "The prism lanterns burn with steady, cold flame. The submerged path is revealed "
                "— the sanctum lies ahead."
            ),
        )

    def check_trigger(self, game_state: GameState) -> bool:
        # Trigger when entering Submerged Antechamber or Collapsed Pier,
        # but only after Tideward Sigils complete.
        if not game_state.get_story_flag(FLAG_ACT3_TIDEWARD_SIGILS_ATTUNED):
            return False
        return game_state.current_room.name in ("Collapsed Pier", "Submerged Antechamber")

    def check_completion(self, game_state: GameState) -> bool:
        return game_state.get_story_flag(FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT)
