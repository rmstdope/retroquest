from ...engine.Quest import Quest
from ...engine.GameState import GameState

class SuppliesForTheJourneyQuest(Quest):
    def __init__(self) -> None:
        super().__init__(
            name="Supplies for the Journey",
            description="Sir Cedric mentioned the need for proper equipment for forest expeditions. Gather essential supplies from the Market District.",
            completion="You have gathered all the essential supplies for forest exploration. The journey supplies quest is complete!"
        )

    def check_completion(self, game_state: GameState) -> bool:
        if not self.is_completed_flag:
            has_survival_kit = any(item.get_name().lower() == "forest survival kit" for item in game_state.inventory)
            has_lantern = any(item.get_name().lower() == "enhanced lantern" for item in game_state.inventory)
            has_rope = any(item.get_name().lower() == "quality rope" for item in game_state.inventory)
            
            if has_survival_kit and has_lantern and has_rope:
                self.is_completed_flag = True
                return True
        return False