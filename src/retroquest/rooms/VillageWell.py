from .Room import Room

class VillageWell(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Village Well",
            description=(
                "An old stone well stands at the village's center, its stones worn smooth by countless "
                "hands. The water below glimmers with a crystalline clarity, and the air is cool and "
                "damp. Moss creeps up the sides, and a wooden bucket hangs from a frayed rope. The well "
                "seems to whisper secrets to those who listen closely."
            ),
            items=[],
            spells=["purify"],
            usable_items=["bucket"],
            characters=[],
            exits={"west": "VegetableField", "east": "BlacksmithsForge"}
        )
