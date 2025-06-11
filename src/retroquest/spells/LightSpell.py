from .Spell import Spell

class LightSpell(Spell):
    def __init__(self):
        super().__init__(name="Light", description="A fundamental spell that conjures a sphere of pure light, banishing darkness from a confined area. This illumination can reveal hidden details, inscriptions, or pathways that were previously obscured by shadow. The light is steady and unwavering, but its reach is limited.")
