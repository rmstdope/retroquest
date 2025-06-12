from .Room import Room
from ..items.SackOfFlour import SackOfFlour
from ..items.MillstoneFragment import MillstoneFragment

class OldMill(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Old Mill",
            description=(
                "A creaky windmill towers above, its sails turning slowly in the breeze. Dusty gears and "
                "cobwebs fill the interior, and the scent of flour hangs in the air. Sunlight streams "
                "through broken windows, illuminating sacks of grain and a heavy millstone. The mill "
                "feels ancient, its walls echoing with the memories of harvests long past."
            ),
            items=[SackOfFlour(), MillstoneFragment()],
            usable_items=["rope"],
            characters=[],
            exits={"north": "AbandonedShed", "east": "Riverbank"}
        )
