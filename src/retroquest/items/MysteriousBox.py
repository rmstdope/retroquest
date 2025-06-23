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
            self.description = f"A small, ornate wooden [item.name]{self.get_name()}[/item.name] covered in strange runes. The lock has clicked open."
            event_msg = f"[event]You try to unlock the [item.name]{self.get_name()}[/item.name].[/event]\n"
            return event_msg + f"A soft click is heard from the [item.name]{self.get_name()}[/item.name] as the lock springs open!"
        return f"[failure]The [item.name]{self.get_name()}[/item.name] is already unlocked.[/failure]"

    def open(self, game_state: GameState) -> str:
        if self.locked:
            return f"[failure]The [item.name]{self.get_name()}[/item.name] is locked. You need to find a way to open it.[/failure]"

        if self.contains_map:
            game_state.add_item_to_inventory(GameMap()) # Add to inventory using aliased Map
            self.contains_map = False # Set contains_map to False
            self.description = "An open, ornate wooden box. It is now empty."
            return f"[event]You open the [item.name]{self.get_name()}[/item.name].[/event]\nInside, you find a [item.name]map[/item.name]! You take the [item.name]map[/item.name] and place it in your inventory."
        else:
            return f"[event]The [item.name]{self.get_name()}[/item.name] is now empty.[/event]"

    # The use_with method might be more complex depending on how spells are targeted.
    # For now, we assume the UnlockSpell will call the .unlock() method directly if cast on this box.
    # If a general "cast <spell> on <target>" command exists, that command would handle finding the box
    # and then calling a method on the spell object, which in turn might call box.unlock().

