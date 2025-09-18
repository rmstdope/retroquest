"""Bless Spell (Act I)

Purpose:
    Introductory boon / morale spell reinforcing thematic support for future trials.

Acquisition:
    Early narrative reward (e.g., shrine interaction or mentor guidance) enabling the player to experience a non-damage, non-utility buff concept.

Core Mechanics:
    - Self cast sets story flag "journey_bless_completed"—acts as a soft milestone marker that other systems can optionally read.
    - Targeted cast mirrors self-cast narrative without additional state tracking.

Story Flags:
    - Sets: journey_bless_completed (generic milestone flag—kept string-based; could be migrated to Act-specific constants later).

Design Notes:
    - If stacking or duration buffs are introduced, convert to a structured Buff system rather than embedding more state here.
    - For consistency with newer flags, consider moving literal to a defined constant in a future refactor.
"""

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
