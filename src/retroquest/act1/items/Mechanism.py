from ...engine.GameState import GameState
from ...engine.Item import Item
from .MillstoneFragment import MillstoneFragment
from .Rope import Rope

class Mechanism(Item):
    def __init__(self):
        super().__init__(
            name="strange mechanism",
            short_name="mechanism",
            description="A strange mechanism with levers and gears that doesn't quite seem to belong to the old mill's original design. It looks like something could be used with it.",
            can_be_carried=False
        )
        self.repaired = False

    def examine(self, game_state: GameState) -> str:
        if self.repaired:
            self.description =  f"The [item.name]{self.get_name()}[/item.name] has been repaired using a [item.name]rope[/item.name]. A compartment is open."
        else:
            self.description = "A strange mechanism with levers and gears that doesn't quite seem to belong to the old mill's original design. It looks like something could be used with it.",
        return super().examine(game_state)

    def use(self, game_state) -> str:
        if self.repaired:
            return f"[failure]The [item.name]{self.get_name()}[/item.name] has already been operated.[/failure]"
        return f"[failure]It looks like you need to use something with the [item.name]{self.get_name()}[/item.name].[/failure]"

    def use_with(self, game_state, other_item: Item) -> str:

        if isinstance(other_item, Rope):
            if self.repaired:
                return f"[failure]The [item.name]{self.get_name()}[/item.name] has already been operated.[/failure]"
            self.repaired = True
            # Remove rope from inventory
            if other_item in game_state.inventory:
                game_state.inventory.remove(other_item)
            
            # Add MillstoneFragment to the current room's items
            millstone_fragment = MillstoneFragment()
            game_state.current_room.add_item(millstone_fragment)
            
            # Update this item's description to reflect the change
            self._description = "The mechanism has been repaired using a rope. A compartment is open."

            event_msg = f"[event]You try to use the [item.name]rope[/item.name] with the [item.name]{self.get_name()}[/item.name].[/event]\n"
            return event_msg + "You manage to thread the [item.name]rope[/item.name] through the [item.name]{self.get_name()}[/item.name]. With a clunk, a hidden compartment slides open, revealing a fragment of the old millstone!"
        else:
            return super().use_with(game_state, other_item)

    def listen(self, game_state) -> str:
        event_msg = f"[event]You listen to the [item.name]{self.get_name()}[/item.name].[/event]\n"
        if self.repaired:
            return event_msg + f"The [item.name]{self.get_name()}[/item.name] is silent now, its purpose served."
        return event_msg + f"You hear a faint whirring and clicking from within the [item.name]{self.get_name()}[/item.name], as if it's waiting for something."
