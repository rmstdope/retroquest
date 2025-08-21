from ...engine.Quest import Quest
from ...engine.GameState import GameState

class TheGatheringStormQuest(Quest):
    def __init__(self) -> None:
        super().__init__(
            name="The Gathering Storm",
            description="Sir Cedric has explained that dark forces are gathering and he needs allies with magical knowledge. This is the main quest that ties together all of Act II's challenges.",
        )

    def is_main(self) -> bool:
        """This is the main quest for Act II."""
        return True

    def check_trigger(self, game_state: GameState) -> bool:
        return True  # This quest is always active once Act II begins

    def check_completion(self, game_state: GameState) -> bool:
        # This quest cannot be completed until ALL other quests in Act II are finished
        required_quests = [
            "The Knight's Test",
            "Supplies for the Journey", 
            "Echoes of the Past",
            "The Healer's Apprentice",
            "Cedric's Lost Honor",
            "The Innkeeper's Daughter",
            "The Ancient Library",
            "The Hermit's Warning",
            "The Forest Guardian's Riddles",
            "Whispers in the Wind",
            "The Merchant's Lost Caravan"
        ]
        
        all_completed = all(game_state.is_quest_completed(quest_name) for quest_name in required_quests)
        
        if all_completed and game_state.has_spell("prophetic_vision"):
            return True
        
        return False
