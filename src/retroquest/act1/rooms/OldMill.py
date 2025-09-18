"""Old Mill (Act I)

Narrative Role:
    Weathered industrial structure offering subtle technological contrast to agrarian village life; houses mysterious Mechanism suggesting hidden systems.

Key Mechanics:
    - Static room currently; Mechanism item hints at potential puzzle/activation sequence.

Story Flags:
    - None yet; if mechanism puzzle added, introduce activation flags (e.g., FLAG_MILL_MECHANISM_REPAIRED).

Contents:
    - Items: SackOfFlour (mundane supply), Mechanism (anomalous interactive object candidate).
    - Characters: None (emphasis on emptiness and latent function).

Design Notes:
    - Potential gateway for crafting, food provision bonuses, or mechanical quest chain.
    - Could provide ambient ticking or gear sounds dynamically once repaired.
"""

from ...engine.Room import Room
from ..items.SackOfFlour import SackOfFlour
from ..items.Mechanism import Mechanism 

class OldMill(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Old Mill",
            description=(
                "A creaky windmill towers above, its sails turning slowly in the breeze. Dusty gears and "
                "cobwebs fill the interior, and the scent of flour hangs in the air. Sunlight streams "
                "through broken windows, illuminating sacks of grain and a heavy millstone. "
                "Amidst the old workings, you notice a strange mechanism with levers and gears that doesn't quite seem to belong to the mill's original design."
            ),
            items=[SackOfFlour(), Mechanism()],
            characters=[],
            exits={"north": "AbandonedShed", "east": "Riverbank"}
        )
