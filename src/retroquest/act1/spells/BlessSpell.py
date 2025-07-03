from ...engine.Spell import Spell

class BlessSpell(Spell):
    def __init__(self):
        super().__init__("bless", "A divine incantation that offers protection and strength to the caster.")

    def cast(self, game_state) -> str:
        game_state.set_story_flag("journey_bless_completed", True)
        return "[event]You cast [spell_name]bless[/spell_name] on yourself.[/event]\nYour resolve is strengthened, and you feel more prepared for the challenges that lie ahead on your journey."
