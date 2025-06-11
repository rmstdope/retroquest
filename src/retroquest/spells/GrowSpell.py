from .Spell import Spell

class GrowSpell(Spell):
    def __init__(self):
        super().__init__(name="Grow", description="A nature-focused incantation that accelerates the natural growth process of plants in a targeted area. It can cause seeds to sprout, flowers to bloom instantaneously, or vines to extend, potentially revealing hidden items or creating new paths. The spell's potency may vary based on the vitality of the surrounding environment.")
