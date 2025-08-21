from ...engine.Character import Character
from ...engine.GameState import GameState
from ...engine.Item import Item
from ..quests.SuppliesForTheJourney import SuppliesForTheJourneyQuest
from ..Act2StoryFlags import FLAG_GAVE_MERCHANTS_FLYER, FLAG_PREMIUM_SELECTION_AVAILABLE

class MasterMerchantAldric(Character):
    def __init__(self) -> None:
        super().__init__(
            name="master merchant aldric",
            description="A prosperous merchant with keen eyes for quality goods. He specializes in premium adventure gear and has connections throughout the trading networks.",
        )

    def talk_to(self, game_state: GameState) -> str:
        if game_state.get_story_flag(FLAG_GAVE_MERCHANTS_FLYER):
            # Set flag for premium selection availability when talking after giving flyer
            game_state.set_story_flag(FLAG_PREMIUM_SELECTION_AVAILABLE, True)
            return ("[character_name]Master Merchant Aldric[/character_name]: Ah, excellent! The flyer grants you access "
                    "to our premium selection. I offer the finest adventure gear in Greendale - survival kits, "
                    "enhanced lanterns, quality rope, and more. What can I help you acquire today?")
        else:
            return ("[character_name]Master Merchant Aldric[/character_name]: Welcome to my establishment. I deal in "
                    "premium adventure gear, but such quality comes at a premium price. Do you have any credentials "
                    "or introduction that would qualify you for my special services?")

    def give_item(self, game_state: GameState, item_object: Item) -> str:
        """Handle giving items to Master Merchant Aldric"""
        if "flyer" in item_object.get_name().lower():
            # Remove the flyer from inventory
            if item_object in game_state.inventory:
                game_state.inventory.remove(item_object)
            game_state.set_story_flag(FLAG_GAVE_MERCHANTS_FLYER, True)
            return ("[event]You offer the [item_name]{item_object.get_name()}[/item_name] to the [character_name]{self.name}[/character_name].[/event]\n"
                    "[success]You present the merchant's flyer to [character_name]Master Merchant Aldric[/character_name]. "
                    "His eyes light up as he examines it. 'Ah, excellent! This flyer grants you access to our premium "
                    "selection and preferred customer pricing. What quality goods can I help you acquire today?'[/success]")
        else:
            return super().give_item(game_state, item_object)

    def buy_item(self, item_name_to_buy: str, game_state: GameState) -> str:
        """Handle buying items from Master Merchant Aldric"""
        if not game_state.get_story_flag(FLAG_GAVE_MERCHANTS_FLYER):
            return f"[failure]Master Merchant Aldric requires proper credentials before selling premium items like the {item_name_to_buy}.[/failure]"
        
        # Find coins in inventory
        coins = next((item for item in game_state.inventory if item.get_name().lower() == "coins"), None)
        
        item_name_lower = item_name_to_buy.lower()
        cost = 0
        item_class = None
        
        if "forest survival kit" in item_name_lower:
            cost = 30  # Reduced from 50
            from ..items.ForestSurvivalKit import ForestSurvivalKit
            item_class = ForestSurvivalKit
        elif "enhanced lantern" in item_name_lower:
            cost = 20  # Reduced from 30
            from ..items.EnhancedLantern import EnhancedLantern
            item_class = EnhancedLantern
        elif "quality rope" in item_name_lower:
            cost = 15  # Reduced from 20
            from ..items.QualityRope import QualityRope
            item_class = QualityRope
        else:
            return super().buy_item(item_name_to_buy, game_state)
        
        if not coins or coins.get_amount() < cost:
            return f"[failure]You don't have enough coins to buy the {item_name_to_buy} (costs {cost} gold).[/failure]"
        
        # Check if already have the item
        if any(item.get_name().lower() == item_name_lower for item in game_state.inventory):
            return f"[info]You already have a {item_name_to_buy}.[/info]"
        
        # Purchase the item
        coins.spend(cost)
        game_state.inventory.append(item_class())
        
        return f"[success]You purchase the {item_name_to_buy} from Master Merchant Aldric for {cost} gold coins.[/success]"