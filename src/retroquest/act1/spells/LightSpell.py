from ...engine.Spell import Spell
from ...engine.GameState import GameState

class LightSpell(Spell):
    def __init__(self) -> None:
        super().__init__("light", "A simple spell that conjures a sphere of light to illuminate dark areas.")

    def cast_spell(self, game_state: GameState) -> str:
        current_room = game_state.current_room
        return current_room.light(game_state) # Pass game_state to light method
