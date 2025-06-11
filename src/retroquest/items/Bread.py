from ..items.Item import Item
from ..items.Key import Key

class Bread(Item):
    def __init__(self) -> None:
        super().__init__(
            name="bread",
            description="A small loaf of fresh, crusty bread. It smells delicious and could restore a bit of energy.",
            can_be_carried=True
        )

    def use(self, game_state) -> str:
        if game_state.current_room.name == "Chicken Coop":
            # Remove bread from inventory
            game_state.remove_item_from_inventory(self.name)
            
            # Add key to the room
            key = Key()
            game_state.current_room.add_item(key)
            
            return "You offer the bread to the chickens. They peck at it excitedly, and in the commotion, something shiny falls from a rafter. It's a small key!"
        else:
            return "You eat a small amount of the bread. It's not very satisfying, but it's better than nothing."

