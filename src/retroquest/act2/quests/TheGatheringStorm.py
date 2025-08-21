from ...engine.Quest import Quest
from ...engine.GameState import GameState

class TheGatheringStormQuest(Quest):
    def __init__(self) -> None:
        super().__init__(
            name="The Gathering Storm",
            description="Sir Cedric has explained that dark forces are gathering and he needs allies with magical knowledge. This is the main quest that ties together all of Act II's challenges.",
        )

    def update(self, game_state: GameState) -> str:
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
            self.complete(game_state)
            return "With all your trials completed and the prophetic vision spell learned, you have proven yourself worthy of Sir Cedric's trust. The Gathering Storm quest is complete!"
        
        return "Continue gathering allies, learning spells, and completing the various challenges throughout Greendale and the forest."