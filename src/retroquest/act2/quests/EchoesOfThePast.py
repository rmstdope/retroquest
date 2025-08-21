from ...engine.Quest import Quest
from ...engine.GameState import GameState

class EchoesOfThePastQuest(Quest):
    def __init__(self) -> None:
        super().__init__(
            name="Echoes of the Past",
            description="Investigate your family heritage and Willowbrook's significance by researching historical records and genealogical information in the Great Hall.",
            completion="You have uncovered important information about your family heritage and Willowbrook's significance in ancient history!"
        )

    def check_completion(self, game_state: GameState) -> bool:
        if game_state.get_story_flag("researched_family_heritage") and not self.is_completed_flag:
            self.is_completed_flag = True
            return True
        return False