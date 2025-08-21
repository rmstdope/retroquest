from ...engine.Room import Room
from ...engine.GameState import GameState
from ..characters.SpectralLibrarian import SpectralLibrarian
from ..items.AncientChronicle import AncientChronicle
from ..items.ProtectiveEnchantments import ProtectiveEnchantments
from ..Act2StoryFlags import FLAG_ANCIENT_LIBRARY_COMPLETED

class HiddenLibrary(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Hidden Library",
            description=(
                "Discovered beneath Greendale through a secret passage, this ancient library contains countless volumes "
                "of magical lore. Glowing crystals provide soft illumination, and the air hums with residual magic. "
                "Protective enchantments shimmer around the most valuable texts. This repository of knowledge holds "
                "secrets that could unlock the mysteries of your destiny."
            ),
            items=[AncientChronicle(), ProtectiveEnchantments()],
            characters=[SpectralLibrarian()],
            exits={"secret_passage": "ResidentialQuarter"}
        )

    def handle_command(self, command: str, game_state: GameState) -> str:
        # Handle "cast mend" or "mend" command on protective enchantments
        if ("cast mend" in command.lower() or "mend" in command.lower()) and ("enchantment" in command.lower() or "barrier" in command.lower() or "protection" in command.lower()):
            if game_state.has_spell("mend") and not game_state.get_story_flag("mended_library_enchantments"):
                game_state.set_story_flag("mended_library_enchantments", True)
                return ("[success]You cast [spell_name]mend[/spell_name] on the damaged protective enchantments. "
                        "The magical barriers flicker and stabilize as your repair magic restores their integrity. "
                        "The shimmering barriers around the most valuable texts now glow steadily. You have proven "
                        "your worthiness and respect for ancient knowledge.[/success]")
            elif not game_state.has_spell("mend"):
                return "[failure]You need to know the [spell_name]mend[/spell_name] spell to repair the protective enchantments.[/failure]"
            else:
                return "[info]You have already repaired the protective enchantments.[/info]"
        
        # Handle examining or reading ancient texts
        elif "read" in command.lower() and ("ancient" in command.lower() or "text" in command.lower() or "book" in command.lower() or "spellbook" in command.lower()):
            if game_state.get_story_flag(FLAG_ANCIENT_LIBRARY_COMPLETED):
                return ("[info]You study the ancient texts, reviewing the knowledge of the [spell_name]dispel[/spell_name] "
                        "spell and the revelations about your heritage. The words of the Chosen One prophecy echo "
                        "in your mind as you contemplate your destiny.[/info]")
            else:
                return ("[info]The protective enchantments prevent you from accessing the most valuable texts. "
                        "You need to repair them first to prove your worthiness to the "
                        "[character_name]Spectral Librarian[/character_name].[/info]")
        
        return super().handle_command(command, game_state)
