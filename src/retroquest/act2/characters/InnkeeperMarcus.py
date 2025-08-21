from ...engine.Character import Character
from ...engine.GameState import GameState
from ...engine.Item import Item
from ..Act2StoryFlags import FLAG_KNOWS_ELENA_CURSE

class InnkeeperMarcus(Character):
    def __init__(self) -> None:
        super().__init__(
            name="innkeeper marcus",
            description="A kind-hearted man who runs The Silver Stag Inn. He has worry lines on his face and glances frequently toward his daughter with obvious concern.",
        )

    def talk_to(self, game_state: GameState) -> str:
        if game_state.get_story_flag(FLAG_KNOWS_ELENA_CURSE):
            return ("[character_name]Innkeeper Marcus[/character_name]: You've spoken with [character_name]Elena[/character_name]? "
                    "Then you understand my desperation. The curse grows stronger each day, and I fear we don't have "
                    "much time left. If you truly can help her, I'll give you anything - rooms, information, whatever you need.")
        else:
            return ("[character_name]Innkeeper Marcus[/character_name]: Welcome to The Silver Stag Inn, friend. We offer "
                    "fine rooms and hearty meals. Though I must say, these have been dark times for my family. "
                    "My daughter... well, perhaps you should speak with her yourself if you're looking to help those in need.")

    def buy_item(self, item_name_to_buy: str, game_state: GameState) -> str:
        """Handle buying items from Innkeeper Marcus"""
        item_name_lower = item_name_to_buy.lower()
        
        if "room key" in item_name_lower:
            # Find coins in inventory
            coins = next((item for item in game_state.inventory if item.get_name().lower() == "coins"), None)
            if not coins or coins.get_amount() < 10:
                return "[failure]You don't have enough coins to rent a room (costs 10 gold).[/failure]"
            
            # Check if already have room key
            if any(item.get_name().lower() == "room key" for item in game_state.inventory):
                return "[info]You already have a room key.[/info]"
            
            # Purchase room key
            coins.spend(10)
            from ..items.RoomKey import RoomKey
            game_state.inventory.append(RoomKey())
            return ("[success]You pay 10 gold coins to [character_name]Innkeeper Marcus[/character_name] for a room. "
                    "He hands you a brass key and explains how to access the private rooms upstairs.[/success]")
        else:
            return super().buy_item(item_name_to_buy, game_state)