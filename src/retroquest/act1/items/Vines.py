from ...engine.Item import Item
from .Stick import Stick
from ...engine.GameState import GameState

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
            return f"[event]You use the [item.name]{other_item.get_name()}[/item.name] to cut through the thick [item.name]{self.get_name()}[/item.name], clearing the way to a small alcove. The [item.name]{other_item.get_name()}[/item.name] shatters from the effort! You find a sturdy [item.name]stick[/item.name] in the revealed alcove and take it.[/event]"
        return super().use_with(game_state, other_item)
