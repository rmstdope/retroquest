from ...engine.GameState import GameState
from ...engine.Item import Item
from .Fish import Fish # Assuming you have a Fish item

class River(Item):
    def __init__(self):
        super().__init__(
            name="river",
            description="A gentle river, its waters flowing steadily. It looks like a good spot for fishing.",
            short_name="river",
        )
        self.fish_available = True # Controls if fish can be caught

    def use_with(self, game_state, other_item) -> str:
        from .FishingRod import FishingRod  # Importing FishingRod to check for interaction
        if isinstance(other_item, FishingRod):
            if not game_state.get_story_flag("learned_fishing_basics"):
                return f"[failure]You have the [item_name]{other_item.get_name()}[/item_name], but you're not quite sure how to fish effectively yet. Perhaps someone could teach you.[/failure]"
            if self.fish_available:
                game_state.add_item_to_inventory(Fish())
                self.fish_available = False # Only one fish can be caught, or implement a cooldown/chance
                self.description="A gentle river, its waters flowing steadily. You've already fished here recently.",
                return f"[event]You cast your line into the [item_name]{self.get_name()}[/item_name] using the [item_name]{other_item.get_name()}[/item_name]. After a moment, you feel a tug and reel in a plump [item_name]fish[/item_name]![/event]\nYou add the fish to your inventory."
            else:
                return "[failure]You cast your line again, but the fish aren't biting right now.[/failure]"
        else:
            return super().use_with(game_state, other_item)
