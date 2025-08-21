from ...engine.Spell import Spell

class NatureSenseSpell(Spell):
    def __init__(self) -> None:
        super().__init__(
            name="nature_sense",
            description=(
                "A druidic spell that enhances your connection to the natural world. "
                "When cast, it allows you to sense the life force of plants and animals around you, "
                "detect hidden paths through forests, and understand the subtle warnings that nature "
                "provides about dangers ahead. This ancient magic was once commonly known among "
                "those who lived in harmony with the wilderness."
            )
        )

    def cast_spell(self, game_state) -> str:
        current_room = game_state.current_room.name
        
        if "forest" in current_room.lower() or "enchanted" in current_room.lower():
            # In forest areas, provide enhanced sensory information
            return ("[success]You cast [spell_name]Nature's Sense[/spell_name] and feel your awareness "
                   "expand throughout the surrounding forest. The whisper of leaves speaks of safe "
                   "passages, the rustle of small creatures warns of predators, and the very air "
                   "reveals the health of the woodland. You sense several hidden paths that wind "
                   "through the trees, offering safer routes through the wilderness.[/success]")
        elif "transition" in current_room.lower():
            # In transition areas, help detect magical boundaries
            return ("[success]You cast [spell_name]Nature's Sense[/spell_name] and feel the magical "
                   "boundaries that separate different realms. The spell reveals the ebb and flow "
                   "of natural energy, showing you where the civilized world ends and wilder magics "
                   "begin. You can sense the ancient protections woven into the very landscape.[/success]")
        else:
            # In other areas, provide general nature awareness
            return ("[info]You cast [spell_name]Nature's Sense[/spell_name] and feel a subtle "
                   "connection to the natural world around you. While there isn't much wilderness "
                   "here, you gain a better understanding of the living things in this area and "
                   "their relationship to the environment.[/info]")
