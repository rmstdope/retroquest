from ...engine.Character import Character
from ...engine.GameState import GameState
from ..Act2StoryFlags import (
    FLAG_ANCIENT_LIBRARY_COMPLETED,
    FLAG_ECHOES_OF_PAST_COMPLETED,
    FLAG_MENDED_LIBRARY_ENCHANTMENTS
)

class SpectralLibrarian(Character):
    def __init__(self) -> None:
        super().__init__(
            name="Spectral Librarian",
            description=(
                "A ghostly figure who appears to be the eternal guardian of this ancient library. Their "
                "ethereal form shimmers with a soft blue light, and ancient wisdom gleams in their "
                "otherworldly eyes. They wear the robes of a scholar from ages past, and their presence "
                "emanates both knowledge and protective purpose. This spirit has watched over these texts "
                "for countless years, ensuring only the worthy gain access to the deepest secrets."
            ),
        )

    def talk_to(self, game_state: GameState) -> str:
        # Check if player has mended the protective enchantments first
        has_mend_spell = game_state.has_spell("mend")
        mended_enchantments = game_state.get_story_flag(FLAG_MENDED_LIBRARY_ENCHANTMENTS)
        
        if not game_state.get_story_flag(FLAG_ANCIENT_LIBRARY_COMPLETED):
            if has_mend_spell and mended_enchantments:
                # Reveal heritage information and complete Echoes of the Past
                game_state.set_story_flag(FLAG_ECHOES_OF_PAST_COMPLETED, True)
                game_state.set_story_flag(FLAG_ANCIENT_LIBRARY_COMPLETED, True)
                
                # Learn dispel spell from ancient texts
                from ..spells.DispelSpell import DispelSpell
                game_state.learn_spell(DispelSpell())
                
                # Add Crystal Focus to the room for player to take
                from ..items.CrystalFocus import CrystalFocus
                game_state.current_room.add_item(CrystalFocus())
                
                return ("[success][character_name]Spectral Librarian[/character_name]: 'Ah, you have repaired the "
                        "protective enchantments with your [spell_name]mend[/spell_name] spell. This shows both "
                        "magical ability and respect for ancient knowledge. I shall reveal what you seek.' The "
                        "spirit's eyes glow brighter as they speak: 'Your bloodline traces back to the ancient "
                        "mages of Willowbrook, those who were chosen to guard against the rising darkness. "
                        "Malakar's interest in your village was no coincidence - he seeks to corrupt or destroy "
                        "the magical heritage that flows through your veins.' They gesture to the ancient texts: "
                        "'Study these tomes to learn the [spell_name]dispel[/spell_name] spell, and take this "
                        "[item_name]Crystal Focus[/item_name] to enhance your growing abilities. Your destiny "
                        "as one of the Chosen is beginning to unfold.'[/success]")
            elif not has_mend_spell:
                return ("[character_name]Spectral Librarian[/character_name]: 'Welcome, seeker of knowledge. I am "
                        "the eternal guardian of this repository. The protective enchantments around the most "
                        "valuable texts have been damaged by time. Prove your worthiness by repairing them with "
                        "the [spell_name]mend[/spell_name] spell, and I shall share the knowledge you seek about "
                        "your heritage and destiny.'")
            else:
                return ("[character_name]Spectral Librarian[/character_name]: 'I sense you have the [spell_name]mend[/spell_name] "
                        "spell, but you must first repair the protective enchantments before I can share the "
                        "ancient knowledge. Cast your mend spell on the damaged barriers.'")
        else:
            return ("[character_name]Spectral Librarian[/character_name]: 'You have proven yourself worthy and "
                    "learned what this library can teach. The knowledge of your bloodline and the [spell_name]dispel[/spell_name] "
                    "spell will serve you well in the challenges ahead. Remember: you are part of an ancient "
                    "lineage chosen to stand against the darkness. Use this knowledge wisely.'")

    def examine(self, game_state: GameState) -> str:
        return ("The [character_name]Spectral Librarian[/character_name] appears to be a scholar from ancient "
                "times, their ethereal form bound to this library by duty and purpose. They radiate wisdom "
                "accumulated over centuries of guarding these precious texts. There's something both "
                "melancholy and noble about their eternal vigil.")