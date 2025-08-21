from ...engine.Quest import Quest
from ...engine.GameState import GameState

class TheInnkeepersDaughterQuest(Quest):
    def __init__(self) -> None:
        super().__init__(
            name="The Innkeeper's Daughter",
            description="Elena, the barmaid at The Silver Stag Inn, has been cursed by a dark wizard. Find a way to break the curse and save her life.",
        )

    def update(self, game_state: GameState) -> str:
        if game_state.get_story_flag("elena_curse_broken"):
            self.complete(game_state)
            return "You have successfully broken Elena's curse! She and her father are eternally grateful."
        
        return "Find a way to break the dark curse affecting Elena. You may need advanced magical abilities and purification methods."