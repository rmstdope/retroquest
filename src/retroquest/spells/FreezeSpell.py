from .Spell import Spell

class FreezeSpell(Spell):
    def __init__(self):
        super().__init__(name="Freeze", description="A powerful elemental spell that drastically lowers the temperature of a targeted area or body of water, causing it to solidify into ice. This can create temporary pathways across water or immobilize creatures susceptible to cold, but its effectiveness wanes quickly under warm conditions or against creatures of fire.")
