from ..GameState import GameState
from .Item import Item

class ShedDoor(Item):
    def __init__(self):
        super().__init__(
            name="shed door",
            description = f"It's a sturdy wooden [item.name]door[/item.name], locked tight. There's a keyhole visible.",
            short_name="door"
        )
        self.locked = True

    def use_with(self, game_state, other_item) -> str: 
        from .Key import Key
        if other_item and isinstance(other_item, Key): # Changed to use isinstance
            if self.locked:
                game_state.remove_item_from_inventory(other_item.get_name())  # Remove the key from inventory
                self.locked = False
                self.description = f"The [item.name]{self.get_name()}[/item.name] is unlocked and slightly ajar."
                game_state.current_room.unlock()
                return f"[event]The [item.name]{other_item.get_name()}[/item.name] turns in the lock! The [item.name]{self.get_name()}[/item.name] creaks open.[/event]\nYou can now enter the shed."
            else:
                return f"[failure]The [item.name]{self.get_name()}[/item.name] is already unlocked.[/failure]"
        elif other_item:
            return f"[failure]You can't use the [item.name]{other_item.get_name()}[/item.name] on the [item.name]shed door[/item.name].[/failure]"
