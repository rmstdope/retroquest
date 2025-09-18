"""Heal Spell (Act I)

Purpose:
    Basic restorative magic introducing the player to supportive spellcasting. Provides
    low-intensity healing flavor and establishes the pattern of self-cast vs. targeted cast.

Acquisition:
    Early-game foundational spell (available during or shortly after initial magical unlocking sequence).

Core Mechanics:
    - Self cast (cast_spell): ambient healing narration; currently no mechanical HP system integrated.
    - Target cast (cast_on_character): mirrors self flavor with recipient substitution.

Story / Flags:
    - Sets no flags directly (pure baseline utility / tutorial spell).

Design Notes:
    - Future health system can hook here (e.g., player.heal(amount)).
    - Maintained minimal logic to keep onboarding clear.
"""

from ...engine.Spell import Spell
from ...engine.GameState import GameState
from ...engine.Character import Character

class HealSpell(Spell):
    def __init__(self) -> None:
        super().__init__("heal", "A restorative spell that mends wounds and alleviates ailments.")

    def cast_spell(self, game_state: GameState) -> str:
        # Implement the logic for the heal spell
        # For example, it might restore player's health
        # game_state.player.heal(20) # Heals 20 HP
        return "[event]You cast [spell_name]heal[/spell_name] on yourself.[/event]\nA warm light envelops you, and you feel your wounds mending."

    def cast_on_character(self, game_state: GameState, target_character: Character) -> str:
        # Implement the logic for healing a character
        return f"[event]You cast [spell_name]heal[/spell_name] on [character_name]{target_character.get_name()}[/character_name].[/event]\nA warm light envelops [character_name]{target_character.get_name()}[/character_name] and the character seems a bit healthier."
