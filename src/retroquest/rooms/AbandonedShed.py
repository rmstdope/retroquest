from .Room import Room
from ..items.BrokenShovel import BrokenShovel
from ..items.MysteriousBox import MysteriousBox

class AbandonedShed(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Abandoned Shed",
            description=(
                "A rickety shed leans precariously at the edge of Willowbrook, its weathered boards "
                "creaking in the wind. Rusty tools and broken crates are scattered about, and a thick "
                "layer of dust covers everything. Shadows gather in the corners, and the air smells of "
                "old earth and forgotten secrets. Something about the place feels both forlorn and "
                "mysteriously inviting."
            ),
            items=[BrokenShovel(), MysteriousBox()],
            characters=[],
            exits={"north": "VillageWell", "south": "OldMill"}
        )
