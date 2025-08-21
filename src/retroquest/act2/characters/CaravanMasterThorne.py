from ...engine.Character import Character
from ...engine.GameState import GameState
from ..quests.TheMerchantsLostCaravan import TheMerchantsLostCaravanQuest

class CaravanMasterThorne(Character):
    def __init__(self) -> None:
        super().__init__(
            name="caravan master thorne",
            description="A weather-beaten man with worried eyes who oversees merchant caravans. He paces anxiously, clearly distressed about some urgent matter.",
        )

    def talk(self, game_state: GameState) -> str:
        if not game_state.is_quest_activated("The Merchant's Lost Caravan"):
            game_state.activate_quest_by_object(TheMerchantsLostCaravanQuest())
            return ("[character_name]Caravan Master Thorne[/character_name]: Thank the gods, someone who looks capable! "
                    "I desperately need help - one of my most valuable caravans has gone missing in the Enchanted Forest. "
                    "It was carrying rare goods and several merchants. I fear the worst, but I must know their fate. "
                    "Would you be willing to search for them? The reward would be substantial.")
        else:
            return ("[character_name]Caravan Master Thorne[/character_name]: Any word on my missing caravan? Every day "
                    "that passes makes me fear the worst for those poor souls.")