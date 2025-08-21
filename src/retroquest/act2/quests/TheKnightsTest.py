from ...engine.Quest import Quest
from ...engine.GameState import GameState

class TheKnightsTestQuest(Quest):
    def __init__(self) -> None:
        super().__init__(
            name="The Knight's Test",
            description="Sir Cedric wants to see proof of your combat abilities before trusting you with important responsibilities. Demonstrate your martial skills with a training sword.",
            completion="You have successfully demonstrated your combat skills to Sir Cedric. He now trusts your abilities!"
        )

    def check_completion(self, game_state: GameState) -> bool:
        if game_state.get_story_flag("demonstrated_combat_skills") and not self.is_completed_flag:
            self.is_completed_flag = True
            return True
        return False