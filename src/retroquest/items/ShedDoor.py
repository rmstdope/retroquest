from ..GameState import GameState
from .Item import Item

class ShedDoor(Item):
    def __init__(self):
        super().__init__(
            name="shed door",
            description="An old, weathered wooden door, firmly shut.",
            short_name="door"
        )
        self.locked = True

    def use_with(self, game_state, other_item) -> str: 
        from .Key import Key
        if other_item and isinstance(other_item, Key): # Changed to use isinstance
            if self.locked:
                game_state.remove_item_from_inventory(other_item.get_name())  # Remove the key from inventory
                self.locked = False
                game_state.current_room.unlock()
                return f"The [item.name]{other_item.get_name()}[/item.name] turns in the lock! The [item.name]{self.get_name()}[/item.name] creaks open."
            else:
                return f"The [item.name]{self.get_name()}[/item.name] is already unlocked."
        elif other_item:
            return f"You can't use the [item.name]{other_item.get_name()}[/item.name] on the [item.name]shed door[/item.name]."

    def examine(self) -> str:
        if self.locked:
            self.description = f"It's a sturdy wooden [item.name]{self.get_name()}[/item.name], locked tight. There's a keyhole visible."
        else:
            self.description = f"The [item.name]{self.get_name()}[/item.name] is unlocked and slightly ajar."
        return super().examine()

    def use(self, game_state: GameState) -> str:
        """Attempt to use the door by itself, which is not a valid action."""
        return f"You try to use the [item.name]{self.get_name()}[/item.name] by itself, but nothing happens. It probably needs to be used with something."
