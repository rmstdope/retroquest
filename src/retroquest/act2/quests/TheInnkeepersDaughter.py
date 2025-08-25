from ...engine.Quest import Quest
from ...engine.GameState import GameState
from ..Act2StoryFlags import (
    FLAG_KNOWS_ELENA_CURSE,
    FLAG_ELENA_CURSE_BROKEN,
    FLAG_INNKEEPERS_DAUGHTER_COMPLETED
)

class TheInnkeepersDaughterQuest(Quest):
    def __init__(self) -> None:
        super().__init__(
            name="The Innkeeper's Daughter",
            description="Elena, the barmaid at The Silver Stag Inn, has been cursed by a dark wizard. Use your magical abilities to break the curse and save her life.",
            completion="Through careful magical healing, you successfully broke Elena's curse. You first strengthened her with a greater heal spell, then purified her spirit with crystal-clear water, and finally used a dispel spell to shatter the dark magic completely. Elena is now free from the wizard's curse!"
        )

    def check_trigger(self, game_state: GameState) -> bool:
        return game_state.get_story_flag(FLAG_KNOWS_ELENA_CURSE)

    def check_completion(self, game_state: GameState) -> bool:
        return game_state.get_story_flag(FLAG_INNKEEPERS_DAUGHTER_COMPLETED)
