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

    def get_exits(self, game_state=None) -> dict:
        """
        Override exits to enforce navigation restriction until city map is used.
        Without using the map, only the path back to Greendale Gates is available.
        """
        if game_state and not game_state.get_story_flag(FLAG_USED_CITY_MAP):
            # Only allow movement back to Greendale Gates until map is used
            return {"south": "GreendaleGates"}
        return self.exits
