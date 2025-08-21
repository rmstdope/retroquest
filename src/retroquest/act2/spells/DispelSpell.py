from ...engine.Spell import Spell
from ...engine.GameState import GameState
from ...engine.Character import Character

class DispelSpell(Spell):
    def __init__(self) -> None:
        super().__init__(
            name="dispel",
            description="A powerful counter-magic spell that can break magical barriers, dispel illusions, and counter enemy enchantments. This advanced magic requires deep understanding of magical theory and precise control.",
        )

    def cast_spell(self, game_state: GameState) -> str:
        return ("[success]You cast [spell_name]dispel[/spell_name], sending out waves of counter-magic that "
                "neutralize hostile enchantments. The spell ripples through the air, ready to break magical "
                "barriers and curses, but finds no active magic to dispel nearby.[/success]")

    def cast_on_character(self, game_state: GameState, target_character: Character) -> str:
        # This method is specifically used for breaking curses like Elena's
        if target_character.get_name().lower() == "barmaid elena":
            return (f"[success]You cast [spell_name]dispel[/spell_name] on [character_name]{target_character.get_name()}[/character_name]. "
                    f"Powerful counter-magic flows around her, breaking apart the remaining dark enchantments "
                    f"that bind the curse. Combined with healing magic and purification, this completely "
                    f"frees her from the curse's influence![/success]")
        else:
            return (f"[success]You cast [spell_name]dispel[/spell_name] on [character_name]{target_character.get_name()}[/character_name]. "
                    f"Counter-magic flows around them, dispelling any minor enchantments or magical effects "
                    f"they may have been affected by.[/success]")

    def cast_on_item(self, game_state: GameState, target_item) -> str:
        # This could be used for breaking magical barriers or dispelling cursed items
        return (f"[success]You cast [spell_name]dispel[/spell_name] on [item_name]{target_item.get_name()}[/item_name]. "
                f"Counter-magic flows through the item, neutralizing any magical enchantments or curses "
                f"that may have been affecting it.[/success]")