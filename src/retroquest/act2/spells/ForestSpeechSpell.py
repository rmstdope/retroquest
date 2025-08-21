from ...engine.Spell import Spell

class ForestSpeechSpell(Spell):
    def __init__(self) -> None:
        super().__init__(
            name="forest_speech",
            description=(
                "An ancient druidic spell that grants the ability to communicate with "
                "trees, plants, and forest creatures. This magic opens your mind to the "
                "slow, deep thoughts of ancient trees and the quick, bright chatter of "
                "woodland animals. Through this spell, you can seek guidance, learn "
                "forest secrets, and understand the hidden wisdom of the natural world."
            )
        )

    def cast_spell(self, game_state) -> str:
        current_room = game_state.current_room.name
        
        if "forest" in current_room.lower() or "grove" in current_room.lower():
            return ("[success]You cast [spell_name]Forest Speech[/spell_name] and suddenly "
                   "the forest comes alive with conversation. The trees whisper their ancient "
                   "wisdom, sharing memories of seasons past and warnings of dangers ahead. "
                   "Small woodland creatures emerge to share news of hidden paths and secret "
                   "places. You feel deeply connected to the living tapestry of the forest.[/success]")
        elif "enchanted" in current_room.lower():
            return ("[success]You cast [spell_name]Forest Speech[/spell_name] in this magical "
                   "realm and the response is overwhelming. Every plant, from the mightiest "
                   "tree to the smallest moss, has something to say. The magical nature of "
                   "this place amplifies your connection, allowing you to understand even "
                   "the most subtle communications from the natural world.[/success]")
        else:
            return ("[info]You cast [spell_name]Forest Speech[/spell_name], but there are "
                   "few natural beings here to communicate with. You sense the faint whispers "
                   "of any plants nearby, but the spell would be much more powerful in a "
                   "forest or natural environment.[/info]")

    def cast_on_character(self, game_state, target_character):
        """Allow communication with forest creatures"""
        character_name = target_character.get_name().lower()
        
        if any(keyword in character_name for keyword in ['tree', 'spirit', 'forest', 'sprite', 'nymph']):
            return (f"[success]You cast [spell_name]Forest Speech[/spell_name] on "
                   f"[character_name]{target_character.get_name()}[/character_name], opening "
                   f"a channel of deep, mystical communication. Through the spell's magic, "
                   f"you can understand their ancient wisdom and forest secrets.[/success]")
        else:
            return (f"[info]You cast [spell_name]Forest Speech[/spell_name] on "
                   f"[character_name]{target_character.get_name()}[/character_name], but this "
                   f"spell is designed for communication with forest beings and natural "
                   f"spirits. It has no effect on this character.[/info]")
