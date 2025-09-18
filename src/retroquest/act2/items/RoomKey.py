"""Room Key (Act II Item)

Narrative Role:
    Access credential for The Silver Stag Inn private rooms. Formalizes a discrete progression beat granting
    player a safe study/rest space and additional narrative surface (InnRooms) once used.

Key Mechanics / Interactions:
    - use_with(Door) while in SilverStagInn triggers room.use_key() which adds east -> InnRooms exit.
    - Consumed upon successful unlock (removed from inventory) to reflect one-time provisioning of access.
    - Provides failure messaging if used in wrong location or without having the key actually in inventory.

Story Flags:
    - Sets: (none directly)
    - Reads: (none)

Progression Effects:
    Opens InnRooms, enabling further interactions / potential rest or lore access points.

Design Notes:
    - Indirect exit mutation keeps unlocking logic encapsulated in SilverStagInn.use_key, enabling reuse of
      pattern for other lockable areas (could evolve into a shared LockableRoom mixin).
    - Key is non-carriable by constructor (can_be_carried=False) suggesting it might normally remain placed
      until obtained—adjust if future design wants player to explicitly pick it up first.
"""

from ...engine.GameState import GameState
from ...engine.Item import Item
from .Door import Door

class RoomKey(Item):
    def __init__(self) -> None:
        super().__init__(
            name="room key",
            short_name="key",
            description="A brass key to a private room at The Silver Stag Inn. The room provides a quiet space for studying and safe storage of important items.",
            can_be_carried=False,
        )

    def use_with(self, game_state: GameState, other_item) -> str:
        from ..rooms.SilverStagInn import SilverStagInn  # Import here to avoid circular imports
        
        # Check if other_item is a Door
        if isinstance(other_item, Door):
            # Check if we're in the Silver Stag Inn
            if isinstance(game_state.current_room, SilverStagInn):
                # Find the room key in inventory (it should be carriable)
                key_in_inventory = None
                for item in game_state.inventory:
                    if isinstance(item, RoomKey):
                        key_in_inventory = item
                        break
                
                if key_in_inventory is None:
                    return "[failure]You don't have a [item_name]room key[/item_name] in your inventory.[/failure]"
                
                # Call the room's use_key method to unlock the east exit
                result = game_state.current_room.use_key()
                
                # Remove the key from inventory after successful use
                if "[success]" in result:
                    game_state.inventory.remove(key_in_inventory)
                
                return result
            else:
                return "[info]You need to be in The Silver Stag Inn to use the key with the door.[/info]"
        else:
            return f"[failure]You can't use the [item_name]{self.get_name()}[/item_name] with the [item_name]{other_item.get_name()}[/item_name].[/failure]"

