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
