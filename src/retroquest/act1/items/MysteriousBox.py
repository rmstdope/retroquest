"""MysteriousBox Item

Narrative Role:
Small locked container introducing multi-step acquisition (unlock → open → retrieve map). Provides early tangible reward loop and object state transitions.

Key Mechanics / Interactions:
- `locked` boolean gates access; `unlock(game_state)` flips state and updates description.
- `open(game_state)` dispenses `Map` exactly once (`contains_map` flag) then becomes inert container.
- Designed for integration with an unlock spell or key-like future mechanic (currently direct method calls expected).

Story Flags (Sets / Reads):
(none) – Progress tracked internally via `locked` and `contains_map`.

Progression Effects:
- Grants `Map` item enabling navigation or future fast-travel/hint systems.

Design Notes:
- Separate `unlock` and `open` preserves clarity and allows alternative unlocking paths (spell, tool, code) without conflating retrieval.
- Could emit a story flag when map acquired if later narrative branches depend on it.

"""

from ...engine.Item import Item
from ..items.Map import Map as GameMap # Alias to avoid potential naming conflicts
from ...engine.GameState import GameState

class MysteriousBox(Item):
    def __init__(self) -> None:
        super().__init__(
            name="mysterious box",
            description="A small, ornate wooden box covered in strange runes. The lid is tightly shut, and it feels oddly heavy for its size. You sense something important is hidden inside.",
            short_name="box",
        )
        self.locked = True
        self.contains_map = True # Initialize contains_map

    def unlock(self, _game_state: GameState) -> str: # game_state not currently used
        if self.locked:
            self.locked = False
            self.description = f"A small, ornate wooden [item_name]{self.get_name()}[/item_name] covered in strange runes. The lock has clicked open."
            event_msg = f"[event]You try to unlock the [item_name]{self.get_name()}[/item_name].[/event]\n"
            return event_msg + f"A soft click is heard from the [item_name]{self.get_name()}[/item_name] as the lock springs open!"
        return f"[failure]The [item_name]{self.get_name()}[/item_name] is already unlocked.[/failure]"

    def open(self, game_state: GameState) -> str:
        if self.locked:
            return f"[failure]The [item_name]{self.get_name()}[/item_name] is locked. You need to find a way to open it.[/failure]"

        if self.contains_map:
            game_state.add_item_to_inventory(GameMap()) # Add to inventory using aliased Map
            self.contains_map = False # Set contains_map to False
            self.description = "An open, ornate wooden box. It is now empty."
            return f"[event]You open the [item_name]{self.get_name()}[/item_name].[/event]\nInside, you find a [item_name]map[/item_name]! You take the [item_name]map[/item_name] and place it in your inventory."
        else:
            return f"[event]The [item_name]{self.get_name()}[/item_name] is now empty.[/event]"

    # The use_with method might be more complex depending on how spells are targeted.
    # For now, we assume the UnlockSpell will call the .unlock() method directly if cast on this box.
    # If a general "cast <spell> on <target>" command exists, that command would handle finding the box
    # and then calling a method on the spell object, which in turn might call box.unlock().

