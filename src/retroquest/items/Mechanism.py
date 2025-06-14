from .Item import Item
from .MillstoneFragment import MillstoneFragment
from .Rope import Rope

class Mechanism(Item):
    def __init__(self):
        super().__init__(
            name="Strange Mechanism",
            short_name="mechanism",
            description="A strange mechanism with levers and gears that doesn't quite seem to belong to the old mill's original design. It looks like something could be used with it.",
            can_be_carried=False
        )
        self.repaired = False

    def get_description(self) -> str:
        if self.repaired:
            return "The strange mechanism has been repaired using a rope. A compartment is open."
        else:
            return self._description # Access the original description

    def use(self, game_state) -> str:
        if self.repaired:
            return "The mechanism has already been operated."
        return "It looks like you need to use something with this mechanism."

    def use_with(self, game_state, other_item: Item) -> str:
        if self.repaired:
            return "The mechanism has already been operated."
            
        if isinstance(other_item, Rope):
            self.repaired = True
            # Remove rope from inventory
            if other_item in game_state.inventory:
                game_state.inventory.remove(other_item)
            
            # Add MillstoneFragment to the current room's items
            millstone_fragment = MillstoneFragment()
            game_state.current_room.add_item(millstone_fragment)
            
            # Update this item's description to reflect the change
            self._description = "The strange mechanism has been repaired using a rope. A compartment is open."

            return "You manage to thread the rope through the strange mechanism. With a clunk, a hidden compartment slides open, revealing a fragment of the old millstone!"
        else:
            return f"You can't use the {other_item.get_name()} with the mechanism."

    def listen(self, game_state) -> str:
        if self.repaired:
            return "The mechanism is silent now, its purpose served."
        return "You hear a faint whirring and clicking from within the mechanism, as if it's waiting for something."
