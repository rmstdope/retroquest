from .Room import Room
from ..items.Stick import Stick
from ..items.WildBerries import WildBerries

class ForestPath(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Forest Path",
            description=(
                "A winding path snakes into the heart of the woods, dappled sunlight flickering through "
                "the canopy above. The air is alive with the scent of pine and wildflowers, and the "
                "ground is soft with moss and fallen leaves. Birds flit between branches, and the "
                "occasional snap of a twig hints at unseen creatures nearby. The path feels ancient, "
                "as if it remembers every footstep that has ever passed this way."
            ),
            items=[Stick(), WildBerries()],
            spells=["grow"],
            usable_items=["knife"],
            characters=[],
            exits={"north": "Riverbank", "east": "HiddenGlade"}
        )
