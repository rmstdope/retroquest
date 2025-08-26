from ...engine.Item import Item
from ..Act2StoryFlags import (
    FLAG_STANDING_STONES_EXAMINED,
    FLAG_NATURE_SENSE_LEARNED
)
from .BoundaryStoneFragment import BoundaryStoneFragment
from ..spells.NatureSenseSpell import NatureSenseSpell
from ...engine.GameState import GameState

class StandingStones(Item):
    def __init__(self) -> None:
        super().__init__(
            name="standing stones",
            short_name="stones",
            description=(
                "Ancient stone monoliths covered in moss and carved with protective runes that pulse with faint magic. "
                "These druidic markers have stood for centuries, representing protection, passage, and the balance "
                "between civilization and wilderness. The old magic within them protects travelers at this threshold."
            ),
            can_be_carried=False,
        )
        self.examined = False
        self.fragment_obtained = False

    def examine(self, game_state: GameState) -> str:
        """Examine the standing stones to learn about their magic and obtain a fragment."""
        if not self.examined:
            self.examined = True
            game_state.set_story_flag(FLAG_STANDING_STONES_EXAMINED, True)
            
            # Give boundary stone fragment
            if not self.fragment_obtained:
                self.fragment_obtained = True
                fragment = BoundaryStoneFragment()
                game_state.add_item_to_inventory(fragment)
                fragment_msg = "\n\n[event]As you study the stones, a small fragment breaks away and falls at your feet. You pick up the [item_name]boundary stone fragment[/item_name].[/event]"
            else:
                fragment_msg = ""
            
            # Learn nature_sense spell automatically
            if not game_state.get_story_flag(FLAG_NATURE_SENSE_LEARNED):
                nature_sense = NatureSenseSpell()
                game_state.learn_spell(nature_sense)
                game_state.set_story_flag(FLAG_NATURE_SENSE_LEARNED, True)
                spell_msg = ("\n\n[success]As you trace the druidic runes with your finger, ancient knowledge flows into your mind. "
                            "The symbols begin to make sense—they're not just markers, but a teaching tool! You feel a "
                            "connection forming with the natural world around you, and suddenly you understand how to "
                            "cast the [spell_name]Nature's Sense[/spell_name] spell![/success]\n\n"
                            "[event]You have learned the spell: [spell_name]Nature's Sense[/spell_name]![/event]")
            else:
                spell_msg = ""
            
            return ("[info]You approach the ancient standing stones and run your hands over their weathered surfaces. "
                    "The runes carved into the stone are clearly druidic—symbols representing protection, passage, and "
                    "the balance between civilization and wilderness. These stones have stood here for centuries, "
                    "marking the boundary between worlds. You can feel the old magic thrumming within them, a gentle "
                    "but powerful force that has protected travelers for generations.[/info]" + fragment_msg + spell_msg)
        else:
            return "The standing stones continue to pulse with ancient magic, their druidic runes a testament to the old ways."
