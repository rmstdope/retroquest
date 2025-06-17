from .Spell import Spell

class BlessSpell(Spell):
    def __init__(self):
        super().__init__("Bless", "A divine incantation that offers protection and strength to the caster.")

    def cast(self, game_state) -> str:
        game_state.set_story_flag("journey_bless_completed", True)
        return "You feel a comforting warmth envelop you, steeling you for the road ahead."
