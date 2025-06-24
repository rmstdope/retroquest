from ...engine.Room import Room
from ..items.SmoothStone import SmoothStone
from ..items.River import River  # Import River
from ..characters.Fisherman import Fisherman

class Riverbank(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Riverbank",
            description=(
                "A gentle river flows past the village. Reeds sway along the banks, and the air is alive with the hum of insects. "
                "A weathered fisherman sits nearby, humming a quiet tune. The riverbank is peaceful, a place where time seems to slow and worries drift away."
            ),
            items=[SmoothStone(), River()],
            characters=[Fisherman()],
            exits={"west": "OldMill", "south": "ForestPath"}
        )
