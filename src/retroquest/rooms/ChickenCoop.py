from .Room import Room
from ..items.Egg import Egg
from ..items.Feather import Feather

class ChickenCoop(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Chicken Coop",
            description=(
                "A small wooden coop stands here, its planks patched and weathered. Nervous chickens "
                "cluck and flutter, their feathers ruffled as they dart between straw nests. The air is "
                "thick with the scent of hay and the occasional squawk. Sunbeams slip through the slats, "
                "casting striped shadows on the dirt floor. Something glints beneath the straw, hinting at "
                "a hidden secret."
            ),
            items=[Egg(), Feather()],
            spells=[],
            usable_items=["bread"],
            characters=[],
            exits={"north": "VegetableField"}
        )
