"""Forest Transition (Act II)

Narrative Role:
    Liminal boundary between civilized MountainPath and enchanted interior forest. Introduces survival preparation theme.

Key Mechanics:
    - get_exits() hides 'east' -> ForestEntrance until FLAG_HERMITS_WARNING_COMPLETED is set (survival kit usage / hermit interaction resolution).
    - StandingStones item provides environmental lore anchor.

Story Flags:
    - Reads: FLAG_HERMITS_WARNING_COMPLETED to enable forward traversal.
    - Sets: None here (flag progression handled via item/NPC context externally).

Contents:
    - NPC: ForestHermit (advisory / gating dialogue).
    - Item: StandingStones (flavor, potential future ritual site).

Design Notes:
    - Early gating room mirrors pattern used later (multi-step forest gating) providing conceptual consistency.
    - Could share a common GateOnFlag mixin if additional simple gate rooms emerge.
"""

from ...engine.Room import Room
from ...engine.GameState import GameState
from ..Act2StoryFlags import FLAG_HERMITS_WARNING_COMPLETED
from ..characters.ForestHermit import ForestHermit
from ..items.StandingStones import StandingStones

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
            items=[StandingStones()],
            characters=[ForestHermit()],
            exits={"west": "MountainPath", "east": "ForestEntrance"}
        )

    def get_exits(self, game_state: GameState) -> dict:
        """Override to conditionally remove east exit if survival kit hasn't been used."""
        exits = super().get_exits(game_state).copy()
        
        # Remove east exit if survival kit hasn't been used
        if not game_state.get_story_flag(FLAG_HERMITS_WARNING_COMPLETED):
            exits.pop("east", None)
            
        return exits
        
        
