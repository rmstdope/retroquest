"""Lantern Item

Narrative Role:
Primary early-game light source revealing hidden items and reinforcing the concept that using an item can alter the environment (spawning new items).

Key Mechanics / Interactions:
- First use transforms the item (renames to ``lantern (lit)``) and reveals `Bread` and `EliorsJournal` in the current room.
- Subsequent uses report that it is already lit (idempotent state change).
- Light emission abstracted; no ongoing fuel tracking.

Story Flags (Sets / Reads):
(none) – Environmental reveal handled directly; no global progression flags.

Progression Effects:
- Teaches players that some items modify the room inventory, encouraging revisiting spaces with newly acquired tools.

Design Notes:
- Uses name mutation plus `short_name` alignment to maintain consistent command targeting.
- Consider future abstraction for light-producing items if additional variants appear (e.g., magical lantern, torch).

"""

from ...engine.GameState import GameState
from ...engine.Item import Item

class Lantern(Item):
    def __init__(self) -> None:
        super().__init__(
            name="lantern",
            description="A well-used brass lantern. Its glass is clean and the wick is fresh, ready to light up the darkest corners."
        )

    def use(self, game_state: GameState) -> str:
        """Lights the lantern if it's not already lit, changing its name, and reveals bread and the journal in the current room."""
        action_taken_message = ""

        if self.name == "lantern":  # If it's not lit yet
            self.name = "lantern (lit)"
            self.short_name = "lantern"  # Update short_name as well
            # Item revealing logic
            from .Bread import Bread
            from .EliorsJournal import EliorsJournal
            game_state.current_room.add_item(Bread())  # Add bread to the room
            game_state.current_room.add_item(EliorsJournal())
            action_taken_message = f"[event]You light the [item_name]{self.get_name()}[/item_name]. The flickering light reveals more of the room. A small loaf of [item_name]bread[/item_name] and a [item_name]journal[/item_name] appear in the light.[/event]"
        else:  # Already lit
            action_taken_message = f"[failure]The [item_name]{self.get_name()}[/item_name] is already lit.[/failure]"

        return action_taken_message
