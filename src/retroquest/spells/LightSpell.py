from .Spell import Spell

class LightSpell(Spell):
    def __init__(self):
        super().__init__("Light", "A simple spell that conjures a sphere of light to illuminate dark areas.")

    def cast(self, game_state) -> str:
        # Implement the logic for the light spell
        # For example, it might reveal hidden details in a dark room
        # current_room = game_state.get_current_room()
        # if current_room.is_dark:
        #     current_room.is_lit = True
        #     return "A sphere of light illuminates the area."
        return "You cast Light, and a gentle glow emanates from your hand."
