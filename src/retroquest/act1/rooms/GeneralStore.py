"""General Store (Act I)

Narrative Role:
    Primary supply vendor introducing basic survival and combat gear early in the game.

Key Mechanics:
    - Static inventory seeded directly (no dynamic purchase state yet).
    - Provides multi-category items (tool, food, light, weapon, armor) to preview breadth of systems.

Story Flags:
    - None currently; transactional logic not yet flag-integrated.

Contents:
    - Items: Rope (climbing/puzzle potential), Apple (consumable), Matches (light source precursor), Sword (weapon), Armor (defense).
    - NPC: Shopkeeper (commerce interaction placeholder).

Design Notes:
    - If economy system expands, migrate static list into merchant inventory abstraction.
    - Consider per-item descriptive pricing or availability flags in later acts.
"""

from ...engine.Room import Room
from ..items.Rope import Rope
from ..items.Apple import Apple
from ..items.Matches import Matches
from ..items.Armor import Armor
from ..items.Sword import Sword
from ..characters.Shopkeeper import Shopkeeper

class GeneralStore(Room):
    def __init__(self) -> None:
        super().__init__(
            name="General Store",
            description=(
                "A cluttered shop overflowing with goods of every kind. Shelves groan under the weight of "
                "rope, apples, matches, and trinkets. The shopkeeper bustles about, dusting jars and "
                "chatting with customers. The air is thick with the mingled scents of fruit, wax, and "
                "old wood. Every corner seems to hold a new surprise, and the promise of a good bargain."
            ),
            items=[Rope(), Apple(), Matches(), Sword(), Armor()],
            characters=[Shopkeeper()],
            exits={"west": "VillageSquare", "south": "BlacksmithsForge"} # Corrected based on RoomsAct1.md and map
        )
