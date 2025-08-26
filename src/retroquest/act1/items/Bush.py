from ...engine.Item import Item
from .WildBerries import WildBerries # Import WildBerries
from ...engine.GameState import GameState # Import GameState
from typing import Any

class Bush(Item):
    def __init__(self) -> None:
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
            return "[event]You cast the [spell_name]grow[/spell_name] spell on the [item_name]bush[/item_name]. It flourishes, and clusters of [item_name]wild berries[/item_name] appear among its leaves![/event]"
        else:
            return "[failure]The [item_name]bush[/item_name] is already full of [item_name]wild berries[/item_name].[/failure]"
