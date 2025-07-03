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
