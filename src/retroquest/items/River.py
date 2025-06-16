from .Item import Item
from .Fish import Fish # Assuming you have a Fish item

class River(Item):
    def __init__(self):
        super().__init__(
            name="River",
            description="A gentle river, its waters flowing steadily. It looks like a good spot for fishing.",
            short_name="river",
        )
        self.fish_available = True # Controls if fish can be caught

    def use_with(self, game_state, other_item) -> str:
        from .FishingRod import FishingRod  # Importing FishingRod to check for interaction
        if isinstance(other_item, FishingRod):
            if not game_state.get_story_flag("learned_fishing_basics"):
                return "You have the rod, but you're not quite sure how to fish effectively yet. Perhaps someone could teach you."
            if self.fish_available:
                game_state.add_item_to_inventory(Fish())
                self.fish_available = False # Only one fish can be caught, or implement a cooldown/chance
                return "You cast your line into the River using the fishing rod. After a moment, you feel a tug and reel in a plump fish!"
            else:
                return "You cast your line again, but the fish aren't biting right now."
        else:
            return super().use_with(game_state, other_item)

    def examine(self, game_state) -> str:
        if self.fish_available:
            return "The river flows gently. It looks like a good spot to fish."
        else:
            return "The river flows gently. You've already fished here recently."
