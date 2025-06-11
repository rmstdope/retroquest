from ..items.Item import Item

class RustyHoe(Item):
    def __init__(self) -> None:
        super().__init__(
            name="rusty hoe",
            description="A gardening hoe with a rusted blade and a splintered handle. It might still be useful for tilling soil.",
            short_name="hoe",
            can_be_carried=True # Explicitly set can_be_carried
        )

    def use(self, game_state) -> str:
        # Check if we are in the Vegetable Field
        if game_state.current_room.name == "Vegetable Field":
            # Check if the coin has already been found (e.g., by a story flag)
            if not game_state.get_story_flag("hoe_used_vegetable_field"):
                # Add coin to inventory
                from .Coin import Coin # Local import to avoid circular dependency if Coin needs Item
                coin = Coin()
                game_state.inventory.append(coin)
                game_state.set_story_flag("hoe_used_vegetable_field", True)
                
                # Remove hoe from inventory as it's consumed/broken
                if self in game_state.inventory:
                    game_state.inventory.remove(self)
                
                return "You till the soil with the rusty hoe. The ground is tough, but you manage to unearth a small, tarnished coin! The hoe, however, breaks apart from the effort."
            else:
                # Remove hoe from inventory if used again and it's somehow still there
                if self in game_state.inventory:
                    game_state.inventory.remove(self)
                return "You till the soil again, but find nothing more. The hoe crumbles in your hands from the exertion."
        else:
            # If not in Vegetable Field, the hoe might just break or be ineffective
            if self in game_state.inventory:
                game_state.inventory.remove(self)
            return "You swing the rusty hoe, but it doesn't seem to have much effect here. It breaks apart from the effort."
