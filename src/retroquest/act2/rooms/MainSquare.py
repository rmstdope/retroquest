from ...engine.Room import Room
from ..items.CityNoticeBoard import CityNoticeBoard
from ..items.MerchantsFlyer import MerchantsFlyer
from ..characters.TownCrier import TownCrier

class MainSquare(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Main Square",
            description=(
                "The heart of Greendale pulses with activity. A grand fountain depicts ancient heroes battling mythical beasts, "
                "while merchants hawk their wares from colorful stalls. Stone buildings with red-tiled roofs surround the square, "
                "and you can see the castle's towers rising majestically to the north. The energy here is infectious - this is "
                "clearly a place where important things happen."
            ),
            items=[CityNoticeBoard(), MerchantsFlyer()],
            characters=[TownCrier()],
            exits={"south": "GreendaleGates", "north": "CastleApproach", "east": "MarketDistrict"}
        )
