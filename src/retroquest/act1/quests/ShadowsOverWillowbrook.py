from ...engine.Quest import Quest
from ...engine.GameState import GameState
from ..Act1StoryFlags import (
    FLAG_INVESTIGATED_WITHERED_CROPS,
    FLAG_WITNESSED_SHADOW_EVENT
)

# TODO: Shadows Over Willowbrook Quest - Steps to Completion
# 1. The player investigates the withered crops or talks to villagers about the darkness.
# 2. The game sets FLAG_INVESTIGATED_WITHERED_CROPS to indicate the investigation has started.
# 3. The player experiences events or encounters that reveal the presence of a shadowy force in Willowbrook.
# 4. The player witnesses a supernatural event or discusses findings with Mira, setting FLAG_WITNESSED_SHADOW_EVENT.
# 5. Dialogue is provided for Mira and villagers about the darkness.
# 6. Optionally, minor obstacles or puzzles related to the darkness are presented.
# 7. The quest is now complete and connects to the main story thread.

class ShadowsOverWillowbrookQuest(Quest):
    def __init__(self):
        super().__init__(
            name="Shadows Over Willowbrook",
            description=(
                "Strange events are plaguing the village: crops are withering, animals are restless, and villagers whisper of a shadowy figure seen at night. "
                "Investigate the source of these disturbances."
            ),
            completion="You have confirmed that a dark force is at work in Willowbrook. Mira warns you that your magical abilities may be the key to protecting the village."
        )

    def check_trigger(self, game_state: GameState) -> bool:
        # Triggered after the player investigates the Vegetable Field or talks to villagers
        return game_state.get_story_flag(FLAG_INVESTIGATED_WITHERED_CROPS)

    def check_completion(self, game_state: GameState) -> bool:
        # Completed after witnessing a supernatural event or talking to Mira about the darkness
        return game_state.get_story_flag(FLAG_WITNESSED_SHADOW_EVENT)
