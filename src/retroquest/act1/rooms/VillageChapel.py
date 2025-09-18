"""Village Chapel (Act I)

Narrative Role:
    Spiritual focal point offering blessing atmosphere and potential future moral or alignment mechanics.

Key Mechanics:
    - Static configuration (no dynamic exits or discovery) emphasizing reflective tone.
    - Hidden locket referenced in flavor text (not yet implemented—potential searchable item hook).

Story Flags:
    - None at present; future blessing/confession systems could introduce them.

Contents:
    - Items: Candle (light / ritual potential), PrayerBook (lore / devotional flavor).
    - NPC: Priest (blessings, guidance, quest hint potential).

Design Notes:
    - Consider adding a gentle search reward (locket) to model exploration reinforcement consistent with later rooms.
    - Could later act as resurrection / penalty mitigation site if difficulty escalates.
"""

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
