"""Forest Entrance (Act II)

Narrative Role:
    Threshold zone to the Enchanted Forest. Establishes environmental tension and introduces dual-item
    preparation requirement (enhanced lantern + protective charm) before deeper biomes become accessible.

Key Mechanics:
    - Overrides get_exits() to dynamically gate 'south' (AncientGrove) and 'east' (WhisperingGlade) until BOTH:
        FLAG_ENHANCED_LANTERN_USED_FOREST_ENTRANCE AND FLAG_PROTECTIVE_CHARM_USED_FOREST_ENTRANCE are True.
    - Prevents premature progression; players receive clear feedback by item usage events elsewhere.

Story Flags:
    - Reads: FLAG_ENHANCED_LANTERN_USED_FOREST_ENTRANCE, FLAG_PROTECTIVE_CHARM_USED_FOREST_ENTRANCE
    - Sets: Neither (flags set by item usage contexts outside this room).

Contents:
    - EnchantedAcorn (forest-aligned quest/interaction item)
    - ForestSprites (ambient magical observers; potential tutorialization channel)

Design Notes:
    - Uses pure read gating to keep logic decentralized (item interactions register their own flags).
    - Could be generalized later into a MultiFlagExitGate helper if pattern repeats across acts.
"""

from ...engine.Room import Room
from ...engine.GameState import GameState
from ..Act2StoryFlags import (
    FLAG_ENHANCED_LANTERN_USED_FOREST_ENTRANCE, 
    FLAG_PROTECTIVE_CHARM_USED_FOREST_ENTRANCE
)
from ..items.EnchantedAcorn import EnchantedAcorn
from ..characters.ForestSprites import ForestSprites

class ForestEntrance(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Forest Entrance",
            description=(
                "Massive trees create a natural cathedral as you enter the Enchanted Forest. Dappled sunlight filters "
                "through the dense canopy, and the path ahead disappears into green shadows. The air is alive with the "
                "sounds of birds and rustling leaves, but underneath lies an expectant silence, as if the forest itself "
                "is watching and waiting. Two paths diverge deeper into the forest - one leads to an ancient grove that "
                "serves as the sacred gateway to the forest's heart, while the other leads to a peaceful glade. "
                "Small motes of light dance between the trees - forest sprites watching your every move."
            ),
            items=[EnchantedAcorn()],
            characters=[ForestSprites()],
            exits={"west": "ForestTransition", "south": "AncientGrove", "east": "WhisperingGlade"}
        )

    def get_exits(self, game_state: GameState) -> dict:
        """Override to conditionally show south and east exits only if enhanced lantern and protective charm have been used."""
        exits = {"west": "ForestTransition"}  # Always allow going back west
        
        # Only show south and east exits if both items have been used
        lantern_used = game_state.get_story_flag(FLAG_ENHANCED_LANTERN_USED_FOREST_ENTRANCE)
        charm_used = game_state.get_story_flag(FLAG_PROTECTIVE_CHARM_USED_FOREST_ENTRANCE)
        
        if lantern_used and charm_used:
            exits["south"] = "AncientGrove"
            exits["east"] = "WhisperingGlade"
            
        return exits
