from .Spell import Spell

class LightSpell(Spell):
    def __init__(self):
        super().__init__("Light", "A simple spell that conjures a sphere of light to illuminate dark areas.")

    def cast(self, game_state) -> str:
        current_room = game_state.current_room
        return current_room.light(game_state) # Pass game_state to light method
