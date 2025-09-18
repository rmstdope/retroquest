from ...engine.Quest import Quest
from ...engine.GameState import GameState
from ..Act3StoryFlags import FLAG_ACT3_TIDEWARD_SIGILS_ATTUNED


class TidewardSigilsQuest(Quest):
    def __init__(self) -> None:
        super().__init__(
            name="Tideward Sigils",
            description=(
                "Collect coquina runes at the shore and engrave a complete Tideward Sigil upon the leaning pillars"
                " to stabilize the flood wards."
            ),
            completion=(
                "You cleansed the pillars and set the coquina runes— the Tideward Sigil resonates and the flood wards"
                " steady, granting safe passage toward the sanctum."
            ),
        )

    def check_trigger(self, game_state: GameState) -> bool:
        # Activate when first reaching the Shoreline Markers in the Sunken Ruins
        return game_state.current_room.name == "Shoreline Markers"

    def check_completion(self, game_state: GameState) -> bool:
        return game_state.get_story_flag(FLAG_ACT3_TIDEWARD_SIGILS_ATTUNED)
