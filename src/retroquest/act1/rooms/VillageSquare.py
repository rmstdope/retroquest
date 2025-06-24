from ...Room import Room
from ..items.Bucket import Bucket
from ..items.OldNotice import OldNotice
from ..characters.Villager import Villager

class VillageSquare(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Village Square",
            description=(
                "The heart of Willowbrook bustles with life. Cobblestone paths radiate from a mossy old well, "
                "and a weathered notice board stands nearby, covered in faded announcements. Children chase "
                "each other around market stalls, and the air is filled with laughter, gossip, and the scent "
                "of fresh bread. The square is a crossroads for villagers, travelers, and secrets alike."
            ),
            items=[Bucket(), OldNotice()],
            characters=[Villager()],
            exits={"west": "EliorsCottage", "north": "MirasHut", "east": "GeneralStore"}
        )
