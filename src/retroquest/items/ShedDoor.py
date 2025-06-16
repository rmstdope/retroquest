from ..GameState import GameState
from .Item import Item

class ShedDoor(Item):
    def __init__(self):
        super().__init__(
            name="Shed Door",
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
                return "The key turns in the lock! The shed door creaks open."
            else:
                return "The shed door is already unlocked."
        elif other_item:
            return f"You can't use the {other_item.get_name()} on the shed door."

    def examine(self) -> str:
        if self.locked:
            return "It's a sturdy wooden door, locked tight. There's a keyhole visible."
        return "The shed door is unlocked and slightly ajar."

    def use(self, game_state: GameState) -> str:
        """Attempt to use the door by itself, which is not a valid action."""
        return "You try to use the door by itself, but nothing happens. It probably needs to be used with something."
