from .Character import Character
from ..items.ShinyRing import ShinyRing
from ..items.WanderingBoots import WanderingBoots
from ..items.Coin import Coin

class Merchant(Character):
    def __init__(self) -> None:
        super().__init__(
            name="Merchant",
            description="A traveling merchant with a cart full of wares and stories from distant lands. Always ready to trade or offer travel advice."
        )
        self.boots_given = False  # Track if boots have been given

    def talk_to(self, game_state, player=None) -> str:
        # Use boots_given flag instead of checking inventory
        if not self.boots_given:
            return ("The Merchant offers a friendly nod. 'Looking for something specific, or just browsing? "
                    "If you have any fine jewelry, especially a shiny ring, I'm ready to exchange it for a pair of sturdy wandering boots.'")
        else:
            return ("The Merchant grins. 'Those boots should serve you well on the road ahead! Let me know if you find anything else of value.'")
    
    def give_item(self, game_state, item):
        from ..items.ShinyRing import ShinyRing
        from ..items.WanderingBoots import WanderingBoots
        if isinstance(item, ShinyRing):
            game_state.remove_item_from_inventory(item.get_name())
            boots = WanderingBoots()
            game_state.add_item_to_inventory(boots)
            self.boots_given = True  # Set flag when boots are given
            return ("The Merchant's eyes widen as you hand over the shiny ring. 'A fine piece! As promised, here are the wandering boots. They'll serve you well on the road to Greendale.'\n\nYou receive a pair of Wandering Boots!")
        return f"The Merchant examines the {item.get_name()} but shakes his head. 'Not interested in that, friend.'"

