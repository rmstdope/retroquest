from ...Item import Item
from ..items.Matches import Matches
from ..items.Locket import Locket  # Added import
from ...GameState import GameState  # Added import for GameState

class Candle(Item):
    def __init__(self) -> None:
        super().__init__(
            name="candle",
            description="A simple beeswax candle. It provides a warm, steady light and a faint, comforting scent."
        )
        self.is_lit = False

    def use_with(self, game_state: GameState, other_item: Item) -> str: # Added type hints
        if isinstance(other_item, Matches):
            if not self.is_lit:
                self.is_lit = True
                self.description = "The candle is lit, casting a warm, steady light."

                # Add a new Locket to the room
                game_state.current_room.add_item(Locket())

                return f"[event]You light the [item.name]{self.get_name()}[/item.name] with the [item.name]{other_item.get_name()}[/item.name].[/event]\nIt now casts a warm glow. The flickering candlelight reveals a [item.name]locket[/item.name] that was previously unseen!"
            else:
                return f"[failure]The [item.name]{self.get_name()}[/item.name] is already lit.[/failure]"
        return super().use_with(game_state, other_item)
