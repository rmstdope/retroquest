from ...engine.Quest import Quest
from ...engine.GameState import GameState

class TheMerchantsLostCaravanQuest(Quest):
    def __init__(self) -> None:
        super().__init__(
            name="The Merchant's Lost Caravan",
            description="Caravan Master Thorne's valuable caravan has gone missing in the Enchanted Forest. Find out what happened to the merchants and their goods.",
        )

    def update(self, game_state: GameState) -> str:
        if game_state.get_story_flag("found_lost_caravan"):
            self.complete(game_state)
            return "You have successfully located the lost caravan and resolved the situation. Caravan Master Thorne is grateful!"
        
        return "Search the Enchanted Forest for the missing caravan and determine the fate of the merchants."