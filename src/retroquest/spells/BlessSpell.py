from .Spell import Spell

class BlessSpell(Spell):
    def __init__(self):
        super().__init__("Bless", "A divine incantation that offers protection and strength to the caster.")

    def cast(self, game_state) -> str:
        # Implement the logic for the bless spell
        # For example, it might increase player's defense or luck
        # game_state.player.add_status_effect("blessed", duration=10)
        return "You feel a comforting warmth envelop you, steeling you for the road ahead."
