from ...engine.Quest import Quest
from ...engine.GameState import GameState
from ...engine.story_flags import FLAG_TALKED_TO_FISHERMAN

class FishingExpeditionQuest(Quest):
    def __init__(self) -> None:
        super().__init__(
            name="Fishing expedition",
            description="You sense the fisherman knows more than he reveals. If you help him, perhaps you will uncover something important.",
            completion="You have helped the fisherman and learned something new about the world around you. Your kindness is rewarded." 
        )

    def check_trigger(self, game_state: GameState) -> bool:
        return game_state.get_story_flag(FLAG_TALKED_TO_FISHERMAN)

    def check_completion(self, game_state: GameState) -> bool:
        return game_state.has_spell('purify')
