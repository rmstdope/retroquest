from .Item import Item
from .Stick import Stick
from ..GameState import GameState

class Vines(Item):
    def __init__(self):
        super().__init__(
            name="Vines",
            description="Thick, thorny vines block a small alcove.",
        )

    def use_with(self, game_state: GameState, other_item: Item) -> str:
        from .SharpKnife import SharpKnife  # Local import to avoid circular dependency
        if isinstance(other_item, SharpKnife):
            game_state.current_room.remove_item(self.name)
            game_state.remove_item_from_inventory(other_item.get_name())
            game_state.current_room.add_item(Stick())
            return "Elior uses the sharp knife to cut through the thick vines, clearing the way to a small alcove. The knife shatters from the effort! You find a sturdy Stick in the revealed alcove and take it."
        return super().use_with(game_state, other_item)
