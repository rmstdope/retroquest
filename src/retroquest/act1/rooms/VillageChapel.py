from ...engine.Room import Room
from ..items.Candle import Candle
from ..items.PrayerBook import PrayerBook
from ..characters.Priest import Priest

class VillageChapel(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Village Chapel",
            description=(
                "A small stone chapel stands in quiet dignity, its stained glass windows casting rainbows "
                "across the worn pews. The air is cool and still, filled with the faint scent of candle wax "
                "and old parchment. A kindly priest tends to the altar, offering blessings and words of "
                "comfort. In the shadows, a hidden locket glimmers, waiting to be discovered."
            ),
            items=[Candle(), PrayerBook()],
            characters=[Priest()],
            exits={"north": "HiddenGlade", "east": "RoadToGreendale"}
        )
