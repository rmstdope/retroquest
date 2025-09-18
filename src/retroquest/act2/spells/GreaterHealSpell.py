"""Greater Heal Spell (Act II)

Purpose:
    Advanced restorative magic used as an intermediate step in Elena's multi-phase cure
    progression and a generalized high-impact healing effect for other characters.

Acquisition:
    Taught by Master Healer Lyria after apprenticeship arc completion (healing quest chain).

Special Handling:
    - When cast on BarmaidElena invokes her receive_greater_heal(game_state) method to advance curse state.
    - Otherwise returns generic restoration messaging.

Design Notes:
    - Delegates narrative branching to target character to keep spell implementation lean.
    - Potential future enhancement: integrate resource cost (mana) once economy layer is added.
"""

from ...engine.Spell import Spell
from ...engine.GameState import GameState
from ...engine.Character import Character

class GreaterHealSpell(Spell):
    def __init__(self) -> None:
        super().__init__(
            name="greater_heal",
            description="An advanced healing spell that can cure serious ailments, break curses, and restore significant health. This powerful magic requires deep understanding of healing arts and compassion.",
        )

    def cast_spell(self, game_state: GameState) -> str:
        return (f"[success]You cast [spell_name]{self.get_name()}[/spell_name], channeling powerful healing energy. "
                "The spell radiates outward, ready to cure serious ailments, but finds no one in immediate "
                "need of healing nearby.[/success]")

    def cast_on_character(self, game_state: GameState, target_character: Character) -> str:
        from ..characters.BarmaidElena import BarmaidElena  # Import here to avoid circular imports
        
        # Special handling for Elena's curse
        if isinstance(target_character, BarmaidElena):
            # Check if Elena has the receive_greater_heal method and call it
            return target_character.receive_greater_heal(game_state)
        else:
            return (f"[success]You cast [spell_name]{self.get_name()}[/spell_name] on [character_name]{target_character.get_name()}[/character_name]. "
                    f"Healing energy flows through them, restoring their vitality and curing any minor ailments they may have had.[/success]")