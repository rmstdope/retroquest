"""Forest Path (Act I)

Narrative Role:
    Early wilderness traversal corridor featuring soft environmental puzzle (clearing vines) and dynamic description shift.

Key Mechanics:
    - get_description() adapts text depending on presence of Vines item (environmental state-as-item pattern).
    - Items list includes Vines (obstruction) and Bush (scenery / potential forage expansion); Stick/WildBerries imports not currently used in room list.

Story Flags:
    - None; gating handled implicitly by item presence rather than flag toggles.

Contents:
    - Items: Vines (removable obstacle), Bush (environment flavor), potential future Stick/WildBerries (foraging hooks elsewhere).
    - Characters: None (focus on atmosphere & environmental interaction).

Design Notes:
    - Consider delegating obstruction removal to item method (e.g., Vines.cut()) to encapsulate side effects.
    - If more rooms adopt dynamic description, abstract a DescriptiveStateMixin mapping state -> text segments.
"""

from ...engine.Room import Room
from ..items.Vines import Vines
from ..items.Bush import Bush # Import Bush
from ...engine.GameState import GameState

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
            items=[Vines(), Bush()], # Add Bush to items
            characters=[],
            exits={"north": "Riverbank", "south": "HiddenGlade"}  # Corrected: HG is South, not East.
        )

    def get_description(self, _game_state: GameState) -> str:  # parameter reserved for future conditional text
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

