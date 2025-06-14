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
        self.knows_travel_advice = True # To control giving boots only once

    def talk_to(self, game_state, player) -> str:
        if self.knows_travel_advice:
            self.knows_travel_advice = False
            player.add_item_to_inventory(WanderingBoots())
            game_state.add_event("The Merchant, noticing your preparations, offers you a sturdy pair of Wandering Boots.")
            return "The Merchant shares some tips for the road ahead and, seeing you're preparing for a long trek, offers you a sturdy pair of Wandering Boots he has spare. \\\"May they serve you well, traveler!\\\" (Wandering Boots added to inventory)"
        
        return "The Merchant offers a friendly nod. \\\"Looking for something specific, or just browsing?\\\""

