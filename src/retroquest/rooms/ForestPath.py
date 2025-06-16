from .Room import Room
from ..items.Stick import Stick
from ..items.WildBerries import WildBerries
from ..items.Vines import Vines

class ForestPath(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Forest Path",
            description=(
                "A winding path snakes into the heart of the woods, dappled sunlight flickering through "
                "the canopy above. A section of the path is blocked by thick, thorny vines. The air is alive with the scent of pine and wildflowers, and the "
                "ground is soft with moss and fallen leaves. Birds flit between branches, and the "
                "occasional snap of a twig hints at unseen creatures nearby. The path feels ancient, "
                "as if it remembers every footstep that has ever passed this way."
            ),
            items=[WildBerries(), Vines()],
            characters=[],
            exits={"north": "Riverbank", "south": "HiddenGlade"}  # Corrected: HG is South, not East.
        )

    def get_description(self, game_state) -> str:
        # Check if vines are still present (i.e., not cut)
        if any(isinstance(item, Vines) for item in self.items):
            return self.description # Original description with vines
        else:
            # Return a description indicating the vines are cut and the alcove is accessible
            return (
                "A winding path snakes into the heart of the woods, dappled sunlight flickering through "
                "the canopy above. Where thick vines once blocked a small alcove, they now lie cut, revealing the opening. The air is alive with the scent of pine and wildflowers, and the "
                "ground is soft with moss and fallen leaves. Birds flit between branches, and the "
                "occasional snap of a twig hints at unseen creatures nearby. The path feels ancient, "
                "as if it remembers every footstep that has ever passed this way."
            )

