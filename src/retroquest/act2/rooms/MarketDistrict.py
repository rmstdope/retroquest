from ...engine.Room import Room
from ...engine.GameState import GameState
from ..characters.MasterMerchantAldric import MasterMerchantAldric
from ..characters.CaravanMasterThorne import CaravanMasterThorne
from ..items.Coins import Coins

class MarketDistrict(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Market District",
            description=(
                "Narrow streets packed with shops, inns, and trading posts create a maze of commerce. The air is thick "
                "with the scents of spices, leather, and fresh bread. Merchant wagons crowd the streets, and you can "
                "hear negotiations in multiple languages. This is where serious business gets done in Greendale."
            ),
            items=[Coins(100)],  # Starting coins for purchases
            characters=[MasterMerchantAldric(), CaravanMasterThorne()],
            exits={"west": "MainSquare", "north": "SilverStagInn", "south": "MerchantsWarehouse"}
        )

    def handle_command(self, command: str, game_state: GameState) -> str:
        # Handle "give merchant's flyer to master merchant aldric" command
        if "give merchant's flyer to master merchant aldric" in command.lower() or "give merchant flyer to aldric" in command.lower():
            flyer = next((item for item in game_state.inventory if "flyer" in item.get_name().lower()), None)
            if flyer:
                game_state.inventory.remove(flyer)
                game_state.set_story_flag("gave_merchants_flyer", True)
                return ("[success]You present the merchant's flyer to [character_name]Master Merchant Aldric[/character_name]. "
                        "His eyes light up as he examines it. 'Ah, excellent! This flyer grants you access to our premium "
                        "selection and preferred customer pricing. What quality goods can I help you acquire today?'[/success]")
            else:
                return "[failure]You don't have a merchant's flyer to give.[/failure]"
        
        # Handle purchasing items
        elif "buy forest survival kit" in command.lower():
            return self._buy_item(game_state, "forest survival kit", 50, "ForestSurvivalKit")
        elif "buy enhanced lantern" in command.lower():
            return self._buy_item(game_state, "enhanced lantern", 30, "EnhancedLantern")
        elif "buy quality rope" in command.lower():
            return self._buy_item(game_state, "quality rope", 20, "QualityRope")
        
        return super().handle_command(command, game_state)

    def _buy_item(self, game_state: GameState, item_name: str, cost: int, item_class_name: str) -> str:
        if not game_state.get_story_flag("gave_merchants_flyer"):
            return f"[failure]Master Merchant Aldric requires proper credentials before selling premium items like the {item_name}.[/failure]"
        
        # Find coins in inventory
        coins = next((item for item in game_state.inventory if item.get_name().lower() == "coins"), None)
        if not coins or coins.get_amount() < cost:
            return f"[failure]You don't have enough coins to buy the {item_name} (costs {cost} gold).[/failure]"
        
        # Check if already have the item
        if any(item.get_name().lower() == item_name for item in game_state.inventory):
            return f"[info]You already have a {item_name}.[/info]"
        
        # Purchase the item
        coins.spend(cost)
        
        # Import and add the item dynamically
        if item_class_name == "ForestSurvivalKit":
            from ..items.ForestSurvivalKit import ForestSurvivalKit
            game_state.inventory.append(ForestSurvivalKit())
        elif item_class_name == "EnhancedLantern":
            from ..items.EnhancedLantern import EnhancedLantern
            game_state.inventory.append(EnhancedLantern())
        elif item_class_name == "QualityRope":
            from ..items.QualityRope import QualityRope
            game_state.inventory.append(QualityRope())
        
        return f"[success]You purchase the {item_name} from Master Merchant Aldric for {cost} gold coins.[/success]"
