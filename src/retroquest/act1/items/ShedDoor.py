"""ShedDoor Item

Narrative Role:
Environmental lock gating entry to a resource/puzzle space. Demonstrates using an item (`Key`) on a static world object to unlock a new area.

Key Mechanics / Interactions:
- `use_with` + `Key` unlocks door, consumes key, updates description, and calls `current_room.unlock()` enabling room transitions or item visibility.
- Prevents redundant unlock attempts with failure feedback.

Story Flags (Sets / Reads):
(none) – State stored locally in `locked` attribute.

Progression Effects:
- Encourages key discovery and reinforces physical gating before expanding map access.

Design Notes:
- Could emit a flag upon unlocking if narrative branches later depend on shed access.

"""

from ...engine.GameState import GameState
from ...engine.Item import Item

class ShedDoor(Item):
    def __init__(self) -> None:
        super().__init__(
            name="shed door",
            description = "It's a sturdy wooden [item_name]door[/item_name], locked tight. There's a keyhole visible.",
            short_name="door"
        )
        self.locked = True

    def use_with(self, game_state: GameState, other_item: Item) -> str: 
        from .Key import Key
        if other_item and isinstance(other_item, Key): # Changed to use isinstance
            if self.locked:
                game_state.remove_item_from_inventory(other_item.get_name())  # Remove the key from inventory
                self.locked = False
                self.description = f"The [item_name]{self.get_name()}[/item_name] is unlocked and slightly ajar."
                game_state.current_room.unlock()
                return f"[event]The [item_name]{other_item.get_name()}[/item_name] turns in the lock! The [item_name]{self.get_name()}[/item_name] creaks open.[/event]\n You can see a few interesting things inside."
            else:
                return f"[failure]The [item_name]{self.get_name()}[/item_name] is already unlocked.[/failure]"
        elif other_item:
            return f"[failure]You can't use the [item_name]{other_item.get_name()}[/item_name] on the [item_name]shed door[/item_name].[/failure]"
