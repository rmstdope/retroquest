from ...engine.Room import Room
from ..characters.ForestHermit import ForestHermit
from ..items.BoundaryStoneFragment import BoundaryStoneFragment
from ..spells.NatureSenseSpell import NatureSenseSpell
from ..quests.TheHermitsWarning import TheHermitsWarning

class ForestTransition(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Forest Transition",
            description=(
                "The boundary between the civilized mountain paths and the wild Enchanted Forest. Ancient standing stones "
                "mark the threshold, covered in moss and carved with protective runes that seem to pulse with faint magic. "
                "The air grows thicker here, and you can sense the forest's ancient power awakening. Beyond lies a realm "
                "where normal rules may not apply. A mysterious figure in forest-green robes sits peacefully among the stones."
            ),
            items=[],
            characters=[ForestHermit()],
            exits={"west": "MountainPath", "east": "ForestEntrance"}
        )
        self.kit_used = False
        self.stones_examined = False
        self.spell_learned = False
        self.fragment_obtained = False
        self.hermit_talked = False
        self.quest_activated = False

    def enter(self, game_state) -> str:
        """Called when the player enters this room."""
        # Activate The Hermit's Warning quest on first entry
        if not self.quest_activated:
            self.quest_activated = True
            hermits_warning = TheHermitsWarning()
            game_state.add_quest(hermits_warning)
            game_state.activate_quest("The Hermit's Warning")
        
        return super().enter(game_state)

    def handle_command(self, command: str, game_state) -> str:
        """Handle room-specific commands for Forest Transition activities."""
        cmd_lower = command.lower().strip()
        
        # Use Forest Survival Kit
        if cmd_lower in ["use forest survival kit", "use kit", "use survival kit"]:
            if game_state.has_item("forest survival kit"):
                if not self.kit_used:
                    self.kit_used = True
                    game_state.set_story_flag("forest_transition_kit_used", True)
                    return ("[success]You open the [item_name]forest survival kit[/item_name] and spread its contents. "
                           "The compass points true north, the rope could secure safe paths through dangerous terrain, "
                           "and the dried rations remind you to prepare for a long journey. Most importantly, you "
                           "study the forest map, learning the locations of safe camping spots and which areas to avoid. "
                           "You feel much more prepared for wilderness survival.[/success]")
                else:
                    return ("You've already made full use of the [item_name]forest survival kit[/item_name].")
            else:
                return "You don't have a forest survival kit to use."
        
        # Examine standing stones
        elif cmd_lower in ["examine stones", "examine standing stones", "look at stones", "inspect stones"]:
            if not self.stones_examined:
                self.stones_examined = True
                game_state.set_story_flag("standing_stones_examined", True)
                
                # Give boundary stone fragment
                if not self.fragment_obtained:
                    self.fragment_obtained = True
                    fragment = BoundaryStoneFragment()
                    game_state.add_item_to_inventory(fragment)
                    fragment_msg = "\n\n[event]As you study the stones, a small fragment breaks away and falls at your feet. You pick up the [item_name]boundary stone fragment[/item_name].[/event]"
                else:
                    fragment_msg = ""
                
                return ("[info]You approach the ancient standing stones and run your hands over their weathered surfaces. "
                       "The runes carved into the stone are clearly druidic—symbols representing protection, passage, and "
                       "the balance between civilization and wilderness. These stones have stood here for centuries, "
                       "marking the boundary between worlds. You can feel the old magic thrumming within them, a gentle "
                       "but powerful force that has protected travelers for generations.[/info]" + fragment_msg)
            else:
                return ("The standing stones continue to pulse with ancient magic, their druidic runes a testament to the old ways.")
        
        # Learn nature_sense spell (requires stones to be examined first)
        elif cmd_lower in ["learn spell", "learn nature spell", "learn nature_sense", "study runes", "learn from stones"]:
            if not game_state.get_story_flag("standing_stones_examined"):
                return ("You should examine the standing stones more carefully first to understand their magical properties.")
            elif not game_state.get_story_flag("nature_sense_learned"):
                nature_sense = NatureSenseSpell()
                game_state.learn_spell(nature_sense)
                game_state.set_story_flag("nature_sense_learned", True)
                return ("[success]You study the druidic runes more intently, focusing on their magical essence. "
                       "The ancient symbols begin to make sense—they're not just markers, but a teaching tool! "
                       "As you trace the patterns with your finger, knowledge flows into your mind. You feel a "
                       "connection forming with the natural world around you, and suddenly you understand how to "
                       "cast the [spell_name]Nature's Sense[/spell_name] spell![/success]\n\n"
                       "[event]You have learned the spell: [spell_name]Nature's Sense[/spell_name]![/event]")
            else:
                return ("You've already learned what the stones can teach you about [spell_name]Nature's Sense[/spell_name].")
        
        # Default room command handling
        return super().handle_command(command, game_state)
