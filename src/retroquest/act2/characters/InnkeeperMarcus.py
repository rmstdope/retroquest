from ...engine.Character import Character
from ...engine.GameState import GameState
from ...engine.Item import Item
from ..items.RoomKey import RoomKey
from ..items.Coins import Coins
from ..Act2StoryFlags import FLAG_KNOWS_ELENA_CURSE

class InnkeeperMarcus(Character):
    def __init__(self) -> None:
        super().__init__(
            name="innkeeper marcus",
            description="A kind-hearted man who runs The Silver Stag Inn. He has worry lines on his face and glances frequently toward his daughter with obvious concern.",
        )
        self.wares = {
            "room key": {"item": RoomKey(), "price": 10}
        }
        self.dialogue_options = [
            "Welcome to The Silver Stag Inn! We offer comfortable rooms and warm meals for weary travelers.",
            "These have been difficult times, but we still maintain the finest accommodations in Greendale.",
            "A good night's rest in a private room can work wonders for mind and body."
        ]
        self.dialogue_index = 0

    def talk_to(self, game_state: GameState) -> str:
        # Build wares information
        wares_info = "I can offer you:\n"
        if self.wares:
            for name, details in self.wares.items():
                wares_info += f"- [item_name]{name.title()}[/item_name]: {details['price']} [item_name]gold coins[/item_name]\n"
        else:
            wares_info = "I'm currently not offering any services.\n"
        
        # Cycle through dialogue options
        dialogue = self.dialogue_options[self.dialogue_index]
        self.dialogue_index = (self.dialogue_index + 1) % len(self.dialogue_options)
        
        if game_state.get_story_flag(FLAG_KNOWS_ELENA_CURSE):
            return (f'The [character_name]Innkeeper Marcus[/character_name] says: [dialogue]"{dialogue} '
                    f'{wares_info.strip()}"[/dialogue]\n\n'
                    "You've spoken with [character_name]Elena[/character_name]? "
                    "Then you understand my desperation. The curse grows stronger each day, and I fear we don't have "
                    "much time left. If you truly can help her, I'll give you anything - rooms, information, whatever you need.")
        else:
            return (f'The [character_name]Innkeeper Marcus[/character_name] says: [dialogue]"{dialogue} '
                    f'{wares_info.strip()}"[/dialogue]\n\n'
                    "Though I must say, these have been dark times for my family. "
                    "My daughter... well, perhaps you should speak with her yourself if you're looking to help those in need.")

    def buy_item(self, item_name_to_buy: str, game_state: GameState) -> str:
        """Handle buying items from Innkeeper Marcus"""
        item_name_to_buy = item_name_to_buy.lower()
        event_msg = f"[event]You try to buy the [item_name]{item_name_to_buy}[/item_name] from the [character_name]{self.get_name()}[/character_name].[/event]"
        
        # Check if item is available
        if item_name_to_buy not in self.wares:
            return event_msg + "\n" + f'[dialogue]"Sorry, I don\'t have any \'[item_name]{item_name_to_buy}[/item_name]\' for sale. Check what I can offer you."[/dialogue]'

        ware_details = self.wares[item_name_to_buy]
        price = ware_details["price"]
        
        # Count total coins in inventory using the batching system
        total_coins = game_state.get_item_count("coins")
                
        # Check if player has enough coins
        if total_coins < price:
            return event_msg + "\n" + f'[failure]You don\'t have enough [item_name]coins[/item_name] for the [item_name]{item_name_to_buy}[/item_name]. It costs {price} [item_name]gold coins[/item_name] but you only have {total_coins}.[/failure]'

        # Check if already have the item in inventory (not counting display items in room)
        if any(item.get_name().lower() == item_name_to_buy and item.can_be_carried for item in game_state.inventory):
            return event_msg + "\n" + f'[dialogue]"You already have a [item_name]{item_name_to_buy}[/item_name]. One room should be sufficient for your stay."[/dialogue]'
        
        # Purchase the item - spend coins using the batching system
        coins_removed = game_state.remove_item_from_inventory("coins", price)
        if coins_removed != price:
            return event_msg + "\n" + f'[failure]Transaction failed. Unable to process payment.[/failure]'
        
        # Remove the display item from the room (if present)
        room_item_to_remove = None
        for item in game_state.current_room.items:
            if item.get_name().lower() == item_name_to_buy:
                room_item_to_remove = item
                break
        
        if room_item_to_remove:
            game_state.current_room.items.remove(room_item_to_remove)
        
        # Create new carriable instance of the item to add to inventory
        new_item = None
        if item_name_to_buy == "room key":
            new_item = RoomKey()
        
        if new_item:
            new_item.can_be_carried = True  # Ensure the purchased item is carriable
            game_state.add_item_to_inventory(new_item)
            remaining_coins = game_state.get_item_count("coins")
            return event_msg + "\n" + f'[success]You purchase the [item_name]{item_name_to_buy}[/item_name] from [character_name]Innkeeper Marcus[/character_name] for {price} [item_name]gold coins[/item_name]. He hands you a brass key and explains how to access the private rooms upstairs. You have {remaining_coins} [item_name]coins[/item_name] remaining.[/success]'
        else:
            # Should not happen if item is in wares, but safety check
            return event_msg + "\n" + f'[failure]An unexpected error occurred trying to rent the room.[/failure]'