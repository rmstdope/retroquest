from ..items.Item import Item
from ..items.Map import Map as GameMap # Alias to avoid potential naming conflicts
from ..GameState import GameState

class MysteriousBox(Item):
    def __init__(self) -> None:
        super().__init__(
            name="mysterious box",
            description="A small, ornate wooden box covered in strange runes. The lid is tightly shut, and it feels oddly heavy for its size. You sense something important is hidden inside.",
            short_name="box",
        )
        self.locked = True
        self.contains_map = True # Initialize contains_map

    def unlock(self, game_state: GameState) -> str: # Added game_state parameter for consistency
        if self.locked:
            self.locked = False
            self.description = "A small, ornate wooden box covered in strange runes. The lock has clicked open."
            return "A soft click is heard from the mysterious box as the lock springs open!"
        return "The mysterious box is already unlocked."

    def open(self, game_state: GameState) -> str:
        if self.locked:
            return "The mysterious box is locked. You need to find a way to open it."
        
        if self.contains_map:
            map_item = GameMap() # Use the aliased Map
            game_state.current_room.add_item(map_item) # Add to current room's items using add_item method
            self.contains_map = False # Set contains_map to False
            self.description = "An open, ornate wooden box. It is now empty."
            return "You open the mysterious box. Inside, you find a fragment of an old map! The map has been placed in the room." 
        else:
            return "The mysterious box is now empty."

    # The use_with method might be more complex depending on how spells are targeted.
    # For now, we assume the UnlockSpell will call the .unlock() method directly if cast on this box.
    # If a general "cast <spell> on <target>" command exists, that command would handle finding the box
    # and then calling a method on the spell object, which in turn might call box.unlock().

