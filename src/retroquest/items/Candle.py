from ..items.Item import Item
from ..items.Matches import Matches
from ..items.HiddenLocket import HiddenLocket  # Added import
from ..GameState import GameState  # Added import for GameState

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

                # Add a new HiddenLocket to the room
                game_state.current_room.add_item(HiddenLocket())
                
                return "You light the candle with the matches. It now casts a warm glow. The flickering candlelight reveals a Hidden Locket that was previously unseen!"
            else:
                return "The candle is already lit."
        return super().use_with(game_state, other_item)
