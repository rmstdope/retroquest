from ...engine.Room import Room
from ..characters.MasterHealerLyria import MasterHealerLyria

class HealersHouse(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Healer's House",
            description=(
                "A cozy cottage filled with the scents of medicinal herbs and healing potions. Dried plants hang from "
                "the rafters, and shelves line the walls, packed with bottles of various sizes and colors. A warm fire "
                "crackles in the hearth, and comfortable chairs invite rest and recovery. This is clearly a place of "
                "healing and learning."
            ),
            items=[],
            characters=[MasterHealerLyria()],
            exits={"south": "ResidentialQuarter"}
        )
        self.emergency_healing_used = False
