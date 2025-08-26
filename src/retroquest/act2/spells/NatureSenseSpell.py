from ...engine.Spell import Spell
from ...engine.GameState import GameState
from ..Act2StoryFlags import FLAG_NATURE_SENSE_USED_WHISPERING_GLADE
from ..characters.WaterNymphs import WaterNymphs

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

    def cast_spell(self, game_state: GameState) -> str:
        current_room = game_state.current_room.name
        
        # Special handling for Whispering Glade
        if current_room == "Whispering Glade":
            if not game_state.get_story_flag(FLAG_NATURE_SENSE_USED_WHISPERING_GLADE):
                game_state.set_story_flag(FLAG_NATURE_SENSE_USED_WHISPERING_GLADE, True)
                # Add the Water Nymphs to the room when first cast
                game_state.current_room.characters.append(WaterNymphs())
                return (
                    "[spell_effect]You cast [spell_name]Nature's Sense[/spell_name] and extend "
                    "your awareness throughout the glade. Immediately, you sense magical presences "
                    "by the stream - graceful forms of living water and moonlight. The water nymphs "
                    "reveal themselves, shimmering into visibility as they recognize your magical "
                    "sensitivity and respect for the natural world.[/spell_effect]"
                )
            else:
                return (
                    "[info]Your [spell_name]Nature's Sense[/spell_name] reveals the familiar presence of the water nymphs "
                    "by the sacred stream, their forms visible and welcoming.[/info]"
                )
        elif "forest" in current_room.lower() or "enchanted" in current_room.lower():
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
