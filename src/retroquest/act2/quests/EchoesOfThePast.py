from ...engine.Quest import Quest
from ...engine.GameState import GameState
from ..Act2StoryFlags import FLAG_RESEARCHED_FAMILY_HERITAGE

class EchoesOfThePastQuest(Quest):
    def __init__(self) -> None:
        super().__init__(
            name="Echoes of the Past",
            description="Investigate your family heritage and Willowbrook's significance by researching historical records and genealogical information in the Great Hall.",
            completion="You have uncovered important information about your family heritage and Willowbrook's significance in ancient history!"
        )

    def check_trigger(self, game_state: GameState) -> bool:
        return game_state.get_story_flag(FLAG_RESEARCHED_FAMILY_HERITAGE)