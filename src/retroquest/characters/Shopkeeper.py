from .Character import Character
from ..items.Rope import Rope
from ..items.Apple import Apple
from ..items.Matches import Matches
from ..items.Coin import Coin

class Shopkeeper(Character):
    def __init__(self) -> None:
        super().__init__(
            name="Shopkeeper",
            description="The owner of the General Store, always bustling about and eager to strike a bargain or share a rumor."
        )
        self.wares = {
            "rope": {"item": Rope(), "price": 1},
            "matches": {"item": Matches(), "price": 4}
        }
        self.dialogue_options = [
            "Welcome to my humble store! Finest goods in Willowbrook, I assure you.",
            "Looking for something specific, or just browsing?",
            "Heard some strange tales from travelers lately. This village isn't as sleepy as it seems."
        ]
        self.dialogue_index = 0

    def talk_to(self, game_state) -> str:
        # Check if priest needs matches and shopkeeper hasn't given them yet
        if game_state.get_story_flag("priest_talked_to") and "matches" in self.wares:
            # Assuming matches_item_in_room is always found if this block is reached
            # Give matches to player for the priest
            game_state.current_room.remove_item("Matches")

            new_matches = Matches() # Create a new instance for the inventory
            game_state.add_item_to_inventory(new_matches)
            
            # Remove matches from wares so they can't be bought/given again
            del self.wares["matches"]
            
            return f'The Shopkeeper leans in. "Ah, you spoke to the Priest? He does get through his matches. Here, take these for him, on the house. Tell him I said hello!" You receive a box of matches.'

        # Standard dialogue if matches aren't being given for the priest
        wares_info = "I have a few things for sale:\n"
        if self.wares:
            for name, details in self.wares.items():
                wares_info += f"- {name.capitalize()}: {details['price']} coin(s)\n"
        else:
            wares_info = "I'm currently out of stock of items for sale.\n"
        
        wares_info += "And remember, you always get an extra apple with every purchase!\n"

        dialogue = self.dialogue_options[self.dialogue_index]
        self.dialogue_index = (self.dialogue_index + 1) % len(self.dialogue_options)
        
        return f'The Shopkeeper says: "{dialogue} {wares_info.strip()}"'

    def give_item(self, item_name: str, game_state) -> str:
        return f'The Shopkeeper chuckles. "Not looking for donations, friend, but I appreciate the thought!"'

    def buy_item(self, item_name_to_buy: str, game_state) -> str:
        item_name_to_buy = item_name_to_buy.lower()
        if item_name_to_buy not in self.wares:
            return f"Sorry, I don't have any '{item_name_to_buy}' for sale."

        ware_details = self.wares[item_name_to_buy]
        price = ware_details["price"]
        item_object = ware_details["item"]

        # Check if player has enough coins
        coin_count = 0
        coins_to_remove = []
        for item in game_state.inventory:
            if isinstance(item, Coin):
                coin_count += 1
        
        if coin_count < price:
            return f"You don't have enough coins for the {item_name_to_buy}. It costs {price} coin(s)."

        # Remove coins from inventory
        removed_coins = 0
        for item in list(game_state.inventory): # Iterate over a copy for safe removal
            if isinstance(item, Coin) and removed_coins < price:
                game_state.inventory.remove(item)
                removed_coins += 1
        
        # Add item to inventory
        # Need to create a new instance of the item to add to inventory
        new_item = Apple()  # Assuming the shopkeeper gives an apple with every purchase
        new_item.can_be_carried = True
        game_state.add_item_to_inventory(new_item)
        if item_name_to_buy == "rope":
            new_item = Rope()
            new_item.can_be_carried = True
        elif item_name_to_buy == "matches":
            new_item = Matches()
        else:
            # Should not happen if item_name_to_buy is in self.wares
            return "An unexpected error occurred trying to sell the item."

        game_state.add_item_to_inventory(new_item)
        
        # Remove item from General Store's items list if it's a unique item or limited stock
        # For now, assume infinite stock in the store, but the player buys one instance.
        # If the store's stock should deplete, that logic would go here,
        # potentially removing item_object from game_state.current_room.items

        return f"You bought a {new_item.get_name()} for {price} coin(s) and got an extra apple as a bonus!"
