from .Spell import Spell

class HealSpell(Spell):
    def __init__(self):
        super().__init__(name="Heal", description="A restorative spell that channels life-giving energy into a target, mending wounds and alleviating physical ailments. While effective for minor to moderate injuries, it may not be sufficient for grave wounds or potent curses. The spell often manifests as a gentle, warm glow around the recipient.")
