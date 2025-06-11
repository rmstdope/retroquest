from .Spell import Spell

class BlessSpell(Spell):
    def __init__(self):
        super().__init__(name="Bless", description="A divine incantation that bathes the caster or a target in holy light, mending minor wounds and instilling a temporary aura of protection against malevolent forces. This blessing is known to bolster courage and ward off weaker dark entities for a short duration.")
