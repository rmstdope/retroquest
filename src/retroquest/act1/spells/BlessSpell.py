from ...engine.Spell import Spell
from ...engine.GameState import GameState
from ...engine.Character import Character

class BlessSpell(Spell):
    def __init__(self) -> None:
        super().__init__("bless", "A divine incantation that offers protection and strength to the caster.")

    def cast_spell(self, game_state: GameState) -> str:
        game_state.set_story_flag("journey_bless_completed", True)
        return "[event]You cast [spell_name]bless[/spell_name] on yourself.[/event]\nYour resolve is strengthened, and you feel more prepared for the challenges that lie ahead on your journey."

    def cast_on_character(self, game_state: GameState, target_character: Character) -> str:
        return f"[event]You cast [spell_name]bless[/spell_name] on [character_name]{target_character.get_name()}[/character_name].[/event]\nA divine light surrounds [character_name]{target_character.get_name()}[/character_name], and they seem strengthened and more resolute."
