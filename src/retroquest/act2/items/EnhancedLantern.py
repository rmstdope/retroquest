"""Enhanced Lantern (Act II Item)

Narrative Role:
    One of the two complementary gating items required to safely penetrate the Enchanted Forest interior.
    Provides narrative and mechanical justification for navigation clarity and magical path revelation.

Key Mechanics / Interactions:
    - Special use logic only at ForestEntrance (contextual illumination & flag set).
    - Sets FLAG_ENHANCED_LANTERN_USED_FOREST_ENTRANCE upon first successful contextual use and renames itself
      to indicate its lit/active state (diegetic feedback in inventory listing).
    - Synergy message appears if the Protective Charm flag is already active (or will appear vice‑versa from charm).
    - Combined with FLAG_PROTECTIVE_CHARM_USED_FOREST_ENTRANCE, unlocks additional exits when ForestEntrance.get_exits
      is queried (room reads both flags; lantern does not directly alter exits).

Story Flags:
    - Sets: FLAG_ENHANCED_LANTERN_USED_FOREST_ENTRANCE
    - Reads: FLAG_PROTECTIVE_CHARM_USED_FOREST_ENTRANCE (to emit synergy success messaging)

Progression Effects:
    One half of the dual-item gate for accessing AncientGrove and WhisperingGlade from ForestEntrance.

Design Notes:
    - Keeps gating passive; room logic centralizes exit mutation, avoiding duplicated unlocking code here.
    - Name mutation communicates persistent active state without additional UI hooks.
    - Non-contextual use provides lore / generic effect description for clarity outside intended room.
"""

from ...engine.GameState import GameState
from ...engine.Item import Item
from ..Act2StoryFlags import FLAG_ENHANCED_LANTERN_USED_FOREST_ENTRANCE, FLAG_PROTECTIVE_CHARM_USED_FOREST_ENTRANCE

class EnhancedLantern(Item):
    def __init__(self) -> None:
        super().__init__(
            name="enhanced lantern",
            short_name="lantern",
            description="A magically enhanced lantern that burns with bright, steady light. The enchantment allows it to illuminate hidden paths and reveal magical auras that would otherwise remain invisible.",
            can_be_carried=True,
        )

    def use(self, game_state: GameState) -> str:
        from ..rooms.ForestEntrance import ForestEntrance  # Import here to avoid circular imports
        
        if isinstance(game_state.current_room, ForestEntrance):
            if not game_state.get_story_flag(FLAG_ENHANCED_LANTERN_USED_FOREST_ENTRANCE):
                game_state.set_story_flag(FLAG_ENHANCED_LANTERN_USED_FOREST_ENTRANCE, True)
                self.name = 'enhanced lantern (lit)'
                result = ("[item_effect]The Enhanced Lantern's crystal core pulses with magical energy, casting "
                        "ethereal blue light that reveals hidden paths through the dense undergrowth. The light "
                        "seems to resonate with the forest's natural magic, illuminating safe routes and warning "
                        "you away from dangerous areas. With this enhanced vision, you can navigate the forest "
                        "with confidence.[/item_effect]")
                
                # Check if both protective charm and enhanced lantern have been used
                if game_state.get_story_flag(FLAG_PROTECTIVE_CHARM_USED_FOREST_ENTRANCE):
                    result += ("\n\n[success]With both the protective charm's spiritual barrier and the enhanced "
                            "lantern's magical illumination active, the forest's deeper paths are now revealed and "
                            "safe to travel. You can now venture deeper into the enchanted woods.[/success]")
                
                return result
            else:
                return ("[info]The Enhanced Lantern continues to provide magical illumination, keeping "
                        "the forest paths clearly visible.[/info]")
        else:
            return "You activate the enhanced lantern. Its magical light pierces through darkness and can reveal hidden passages, magical traces, and secret paths that ordinary light cannot illuminate."