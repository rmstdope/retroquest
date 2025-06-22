from .Spell import Spell
from ..items.WitheredCarrot import WitheredCarrot

class GrowSpell(Spell):
    def __init__(self):
        super().__init__("grow", "A nature spell that encourages plants to flourish.")

    def cast(self, game_state, target_item=None) -> str:
        if target_item:
            return target_item.grow(game_state)
        return "You cast Grow. The nearby plants seem to respond with vibrant energy, but nothing else happens."
