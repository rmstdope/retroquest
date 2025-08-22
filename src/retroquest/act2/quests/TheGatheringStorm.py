from ...engine.Quest import Quest
from ...engine.GameState import GameState
from ..Act2StoryFlags import FLAG_SPOKEN_TO_SIR_CEDRIC

class TheGatheringStormQuest(Quest):
    def __init__(self) -> None:
        super().__init__(
            name="The Gathering Storm",
            description="Having just arrived in the bustling city of Greendale, Elior senses an ominous presence growing in the shadows. Strange whispers speak of dark forces gathering strength, threatening the peace of both the city and the surrounding lands. To understand the true nature of this emerging threat and find a way to combat it, Elior must seek out Sir Cedric, the respected knight commander, who may hold crucial knowledge about the darkness that approaches.",
        )
        self._flag_state = {}

    def is_main(self) -> bool:
        """This is the main quest for Act II."""
        return True

# TODO Add a number of updates to the quest
    def check_trigger(self, game_state: GameState) -> bool:
        return True  # This quest is always active once Act II begins

    def check_update(self, game_state: GameState) -> bool:
        updated = False
        self.description = ''
        new_desc = (
            "Having just arrived in the bustling city of Greendale, Elior senses an ominous presence growing in the shadows. Strange whispers speak of dark forces gathering strength, threatening the peace of both the city and the surrounding lands. To understand the true nature of this emerging threat and find a way to combat it, Elior must seek out Sir Cedric, the respected knight commander, who may hold crucial knowledge about the darkness that approaches."
        )
        if game_state.get_story_flag(FLAG_SPOKEN_TO_SIR_CEDRIC):
            if not self._flag_state.get(FLAG_SPOKEN_TO_SIR_CEDRIC):
                self._flag_state[FLAG_SPOKEN_TO_SIR_CEDRIC] = True
                updated = True
            self.description += '[dim]' + new_desc + '[/dim]'
            new_desc = (
                "\nSir Cedric has explained that dark forces are gathering and he needs allies with magical knowledge. "
            )
        self.description += new_desc
        return updated

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
