from ...engine.GameState import GameState
from ...engine.Item import Item
from ..Act2StoryFlags import FLAG_ACCESSED_INN_ROOM
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
        # Check if other_item is a Door
        if isinstance(other_item, Door):
            # Check if we're in the Silver Stag Inn
            if game_state.current_room.name == "The Silver Stag Inn":
                # Find the room key in inventory (it should be carriable)
                key_in_inventory = None
                for item in game_state.inventory:
                    if item.get_name().lower() == "room key":
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

