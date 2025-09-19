"""Mechanism Item

Narrative Role:
    Central repair puzzle object in the mill context. Encourages combining a structural aid
    (``Rope``) to restore function and reveal a hidden component (``MillstoneFragment``).

Key Mechanics / Interactions:
    - ``use_with`` + ``Rope`` repairs, consumes rope, spawns ``MillstoneFragment``, sets
      ``repaired`` state, updates description.
    - Post-repair examine/listen feedback differentiates pre/post states.

Story Flags (Sets / Reads):
    (none) – local boolean state only.

Progression Effects:
    - Advances mill-related discovery; introduces concealed compartment reveal pattern.

Design Notes:
    - Pre-refactor code used a trailing comma on a description assignment (creating a tuple);
      that has been corrected here.
    - Could emit a flag for global narrative reactions (e.g., mill operational status) later.
"""

from ...engine.GameState import GameState
from ...engine.Item import Item
from .MillstoneFragment import MillstoneFragment
from .Rope import Rope

class Mechanism(Item):
    def __init__(self) -> None:
        super().__init__(
            name="strange mechanism",
            short_name="mechanism",
            description=(
                "A strange mechanism with levers and gears that doesn't quite seem to belong to the "
                "old mill's original design. It looks like something could be used with it."
            ),
            can_be_carried=False,
        )
        self.repaired = False

    def examine(self, game_state: GameState) -> str:
        if self.repaired:
            self.description = (
                f"The [item_name]{self.get_name()}[/item_name] has been repaired using a "
                "[item_name]rope[/item_name]. A compartment is open."
            )
        else:
            self.description = (
                "A strange mechanism with levers and gears that doesn't quite seem to belong to the "
                "old mill's original design. It looks like something could be used with it."
            )
        return super().examine(game_state)

    def use(self, game_state: GameState) -> str:
        if self.repaired:
            return (
                f"[failure]The [item_name]{self.get_name()}[/item_name] has already been "
                "operated.[/failure]"
            )
        return (
            f"[failure]It looks like you need to use something with the "
            f"[item_name]{self.get_name()}[/item_name].[/failure]"
        )

    def use_with(self, game_state, other_item: Item) -> str:

        if isinstance(other_item, Rope):
            if self.repaired:
                return (
                    f"[failure]The [item_name]{self.get_name()}[/item_name] has already been "
                    "operated.[/failure]"
                )
            self.repaired = True
            # Remove rope from inventory
            if other_item in game_state.inventory:
                game_state.inventory.remove(other_item)
            
            # Add MillstoneFragment to the current room's items
            millstone_fragment = MillstoneFragment()
            game_state.current_room.add_item(millstone_fragment)
            
            # Update this item's description to reflect the change
            self.description = (
                "The mechanism has been repaired using a rope. A compartment is open."
            )

            event_msg = (
                f"[event]You try to use the [item_name]rope[/item_name] with the "
                f"[item_name]{self.get_name()}[/item_name].[/event]\n"
            )
            return (
                event_msg
                + f"You manage to thread the [item_name]rope[/item_name] through the "
                f"[item_name]{self.get_name()}[/item_name]. With a clunk, a hidden compartment "
                "slides open, revealing a fragment of the old millstone!"
            )
        else:
            return super().use_with(game_state, other_item)

    def listen(self, game_state: GameState) -> str:
        event_msg = (
            f"[event]You listen to the [item_name]{self.get_name()}[/item_name].[/event]\n"
        )
        if self.repaired:
            return (
                event_msg
                + f"The [item_name]{self.get_name()}[/item_name] is silent now, its purpose "
                "served."
            )
        return (
            event_msg
            + f"You hear a faint whirring and clicking from within the "
            f"[item_name]{self.get_name()}[/item_name], as if it's waiting for something."
        )
