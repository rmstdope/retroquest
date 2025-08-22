from ...engine.Room import Room
from ..items.EnchantedAcorn import EnchantedAcorn
from ..items.ForestMapFragment import ForestMapFragment
from ..characters.ForestSprites import ForestSprites

class ForestEntrance(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Forest Entrance",
            description=(
                "Massive trees create a natural cathedral as you enter the Enchanted Forest. Dappled sunlight filters "
                "through the dense canopy, and the path ahead disappears into green shadows. The air is alive with the "
                "sounds of birds and rustling leaves, but underneath lies an expectant silence, as if the forest itself "
                "is watching and waiting. Two paths diverge deeper into the forest - one leads to an ancient grove that "
                "serves as the sacred gateway to the forest's heart, while the other leads to a peaceful glade. "
                "Small motes of light dance between the trees - forest sprites watching your every move."
            ),
            items=[EnchantedAcorn(), ForestMapFragment()],
            characters=[ForestSprites()],
            exits={"west": "ForestTransition", "south": "AncientGrove", "east": "WhisperingGlade"}
        )
