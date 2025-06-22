from .Quest import Quest
from ..GameState import GameState

class FishingExpeditionQuest(Quest):
    def __init__(self) -> None:
        super().__init__(
            name="Fishing expedition",
            description="You sense the fisherman knows more than he reveals. If you help him, perhaps you will uncover something important.",
            completion="You have helped the fisherman and learned something new about the world around you. Your kindness is rewarded." 
        )

    def check_trigger(self, game_state: GameState) -> bool:
        return game_state.get_story_flag("talked_to_fisherman")

    def check_completion(self, game_state: GameState) -> bool:
        return game_state.has_spell('purify')
