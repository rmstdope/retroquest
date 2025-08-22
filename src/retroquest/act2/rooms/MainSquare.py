from ...engine.Room import Room
from ..items.CityNoticeBoard import CityNoticeBoard
from ..items.MerchantsFlyer import MerchantsFlyer
from ..characters.TownCrier import TownCrier
from ..Act2StoryFlags import FLAG_USED_CITY_MAP

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
        self.city_map_used = False

    def get_exits(self) -> dict:
        """
        Return exits based on whether city map has been used.
        Without using the map, only the path back to Greendale Gates is available.
        """
        if self.city_map_used:
            return self.exits
        else:
            return {"south": "GreendaleGates"}

    def enable_city_navigation(self) -> None:
        """Enable all exits after city map is used."""
        self.city_map_used = True
