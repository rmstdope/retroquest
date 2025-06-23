from .Spell import Spell

class HealSpell(Spell):
    def __init__(self):
        super().__init__("heal", "A restorative spell that mends wounds and alleviates ailments.")

    def cast(self, game_state) -> str:
        # Implement the logic for the heal spell
        # For example, it might restore player's health
        # game_state.player.heal(20) # Heals 20 HP
        return "[event]You cast heal on yourself.[/event]\nA warm light envelops you, and you feel your wounds mending."
