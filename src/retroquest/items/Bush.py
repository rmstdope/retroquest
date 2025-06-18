from .Item import Item
from .WildBerries import WildBerries # Import WildBerries
from ..GameState import GameState # Import GameState

class Bush(Item):
    def __init__(self):
        super().__init__(
            name="bush",
            description="A dense, leafy bush. It looks like it might be hiding something, or just be a bush.",
            short_name="bush",
            can_be_carried=False
        )

    def grow(self, game_state: GameState) -> str:
        current_room = game_state.current_room
        if not current_room.get_item_by_name("wild berries"):
            current_room.add_item(WildBerries())
            return "You cast the [spell.name]grow[/spell.name] spell on the [item.name]bush[/item.name]. It flourishes, and clusters of wild berries appear among its leaves!"
        else:
            return "The [item.name]bush[/item.name] is already full of [item.name]wild berries[/item.name]."
