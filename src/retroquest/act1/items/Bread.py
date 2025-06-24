from ...engine.GameState import GameState
from .Chicken import Chicken
from ...engine.Item import Item
from .Key import Key

class Bread(Item):
    def __init__(self) -> None:
        super().__init__(
            name="bread",
            description="A small loaf of fresh, crusty bread. It smells delicious and could restore a bit of energy.",
            can_be_carried=True
        )

    def use_with(self, game_state: GameState, target: Item) -> str:
        if isinstance(target, Chicken):
            # Remove bread from inventory
            game_state.remove_item_from_inventory(self.name)
            # Add key to the room
            game_state.current_room.add_item(Key())            
            return "[event]You offer the [item.name]bread[/item.name] to the [character.name]chickens[/character.name].[/event]\nThey peck at it excitedly, and in the commotion, something shiny falls from a rafter. It's a [item.name]small key[/item.name]!"
        else:
            return f"[failure]You can't use the [item.name]bread[/item.name] with the [item.name]{target.get_name()}[/item.name].[/failure]"

