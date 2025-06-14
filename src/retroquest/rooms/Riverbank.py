from .Room import Room
from ..items.SmoothStone import SmoothStone
from ..items.FishingRod import FishingRod
from ..characters.Fisherman import Fisherman

class Riverbank(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Riverbank",
            description=(
                "A gentle river winds past the village, its waters sparkling in the sunlight. Reeds sway "
                "along the banks, and the air is alive with the hum of insects and the splash of fish. "
                "A weathered fisherman sits nearby, casting his line and humming a quiet tune. The "
                "riverbank is peaceful, a place where time seems to slow and worries drift away."
            ),
            items=[SmoothStone(), FishingRod()],
            characters=[Fisherman()],
            exits={"west": "OldMill", "south": "ForestPath"}
        )
