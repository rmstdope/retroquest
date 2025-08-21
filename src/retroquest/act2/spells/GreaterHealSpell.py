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
        return ("[success]You cast [spell_name]greater_heal[/spell_name], channeling powerful healing energy. "
                "The spell radiates outward, ready to cure serious ailments, but finds no one in immediate "
                "need of healing nearby.[/success]")

    def cast_on_character(self, game_state: GameState, target_character: Character) -> str:
        # This method can be used for healing specific characters like Elena
        if target_character.get_name().lower() == "barmaid elena":
            return (f"[success]You cast [spell_name]greater_heal[/spell_name] on [character_name]{target_character.get_name()}[/character_name]. "
                    f"Powerful healing energy flows through her, beginning to battle the dark curse that afflicts her. "
                    f"The spell makes significant progress, but breaking the curse completely will require additional "
                    f"purification and dispelling magic.[/success]")
        else:
            return (f"[success]You cast [spell_name]greater_heal[/spell_name] on [character_name]{target_character.get_name()}[/character_name]. "
                    f"Healing energy flows through them, restoring their vitality and curing any minor ailments they may have had.[/success]")