from ...engine.Character import Character
from ...engine.GameState import GameState
from ..quests.SuppliesForTheJourney import SuppliesForTheJourneyQuest

class MasterMerchantAldric(Character):
    def __init__(self) -> None:
        super().__init__(
            name="master merchant aldric",
            description="A prosperous merchant with keen eyes for quality goods. He specializes in premium adventure gear and has connections throughout the trading networks.",
        )

    def talk(self, game_state: GameState) -> str:
        if game_state.get_story_flag("gave_merchants_flyer"):
            # Activate the supplies quest when talking after giving flyer
            if not game_state.is_quest_activated("Supplies for the Journey"):
                game_state.activate_quest_by_object(SuppliesForTheJourneyQuest())
            return ("[character_name]Master Merchant Aldric[/character_name]: Ah, excellent! The flyer grants you access "
                    "to our premium selection. I offer the finest adventure gear in Greendale - survival kits, "
                    "enhanced lanterns, quality rope, and more. What can I help you acquire today?")
        else:
            return ("[character_name]Master Merchant Aldric[/character_name]: Welcome to my establishment. I deal in "
                    "premium adventure gear, but such quality comes at a premium price. Do you have any credentials "
                    "or introduction that would qualify you for my special services?")