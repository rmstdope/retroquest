from .Spell import Spell

class UnlockSpell(Spell):
    def __init__(self):
        super().__init__(name="Unlock", description="A specialized incantation designed to magically bypass mundane locks and simple wards. This spell can manipulate tumblers, slide bolts, or unravel minor enchantments that seal containers or doorways. It is ineffective against complex magical seals or heavily fortified locks.")
