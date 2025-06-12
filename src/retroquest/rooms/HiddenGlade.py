from .Room import Room
from ..items.RareFlower import RareFlower
from ..items.ShinyPebble import ShinyPebble
from ..characters.Deer import Deer

class HiddenGlade(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Hidden Glade",
            description=(
                "A peaceful clearing bathed in golden sunlight, hidden deep within the forest. Wildflowers "
                "carpet the ground, and a gentle breeze stirs the tall grass. In the center, a mossy stone "
                "bears a faint, magical inscription. A graceful deer grazes quietly, occasionally lifting "
                "its head to watch you with wise, gentle eyes. The glade feels enchanted, a place where "
                "the world holds its breath."
            ),
            items=[RareFlower(), ShinyPebble()],
            usable_items=[],
            characters=[Deer()],
            exits={"north": "ForestPath", "south": "VillageChapel"}
        )