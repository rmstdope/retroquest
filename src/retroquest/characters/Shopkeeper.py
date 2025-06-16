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
        wares_info = "I have a few things for sale:\n"
        for name, details in self.wares.items():
            wares_info += f"- {name.capitalize()}: {details['price']} coin(s)\n"
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
            game_state.current_room.get_item_by_name("matches").remove()
            new_item.can_be_carried = True
        else:
            # Should not happen if item_name_to_buy is in self.wares
            return "An unexpected error occurred trying to sell the item."

        game_state.add_item_to_inventory(new_item)
        
        # Remove item from General Store's items list if it's a unique item or limited stock
        # For now, assume infinite stock in the store, but the player buys one instance.
        # If the store's stock should deplete, that logic would go here,
        # potentially removing item_object from game_state.current_room.items

        return f"You bought a {new_item.get_name()} for {price} coin(s) and got an extra apple as a bonus!"
