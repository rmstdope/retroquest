"""Blacksmith's Forge (Act I)

Narrative Role:
    Craftsmanship focal point emphasizing equipment culture and environmental immersion (heat, sound, sparks).

Key Mechanics:
    - Currently static; future upgrade, repair, or forging systems could anchor here.

Story Flags:
    - None presently; progression-neutral location.

Contents:
    - Item: Horseshoe (flavor / potential crafting input or luck charm hook).
    - NPC: Blacksmith (candidate for gear enhancement or repair interactions later).

Design Notes:
    - Serves as sensory contrast to quieter village locations.
    - If forging introduced, may warrant a ForgingStation item abstraction to manage recipes.
"""

from ...engine.Room import Room
from ..items.Horseshoe import Horseshoe
from ..characters.Blacksmith import Blacksmith

class BlacksmithsForge(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Blacksmith's Forge",
            description=(
                "A hot, smoky forge glows with the light of burning coals. The clang of hammer on anvil "
                "echoes through the air, mingling with the scent of molten metal and sweat. Tools and "
                "half-finished weapons hang from the walls, and the blacksmith wipes his brow, his arms "
                "corded with muscle. Sparks dance in the gloom, and the heat is almost overwhelming."
            ),
            items=[Horseshoe()],
            characters=[Blacksmith()],
            exits={"west": "VillageWell", "north": "GeneralStore"}
        )
