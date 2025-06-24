from ...Room import Room
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
