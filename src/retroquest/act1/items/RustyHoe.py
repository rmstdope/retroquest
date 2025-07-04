from ...engine.GameState import GameState
from ...engine.Item import Item

class RustyHoe(Item):
    def __init__(self) -> None:
        super().__init__(
            name="rusty hoe",
            description="A gardening hoe with a rusted blade and a splintered handle. It might still be useful for tilling soil.",
            short_name="hoe",
            can_be_carried=True # Explicitly set can_be_carried
        )

    def use(self, game_state) -> str:
        from .Coin import Coin # Local import to avoid circular dependency if Coin needs Item

        if game_state.current_room.name == "Vegetable Field":
            # Check if the player already has a coin in their inventory
            player_has_coin = any(isinstance(item, Coin) for item in game_state.inventory)
            
            if not player_has_coin:
                game_state.add_item_to_inventory(Coin()) # Assumes GameState has add_item_to_inventory
                return "[event]You till the soil with the [item_name]rusty hoe[/item_name].\n[/event]The ground is tough, and you unearth a small, tarnished [item_name]coin[/item_name]! You quickly pocket it."
            else:
                return "[failure]You till the soil again with the [item_name]hoe[/item_name], but it seems you've already found what was hidden here.[/failure]"
        else:
            # If not in Vegetable Field, the hoe is ineffective but not consumed
            return "[failure]You swing the [item_name]rusty hoe[/item_name], but it doesn't seem to have much effect here. It's a sturdy (but rusty) tool, though.[/failure]"
