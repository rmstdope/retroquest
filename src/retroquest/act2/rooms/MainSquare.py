"""Main Square (Act II)

Narrative Role:
    Central urban hub establishing city scale; unlocks full directional navigation after player orients using map.

Key Mechanics:
    - get_exits() restricts movement to south (GreendaleGates) until enable_city_navigation() invoked (city_map_used=True).
    - Exits dictionary remains intact; gating chooses between minimal vs. full set.

Story Flags:
    - Potential tie-in: FLAG_USED_CITY_MAP (import present) though current implementation relies on local boolean only.

Contents:
    - Items: CityNoticeBoard (information surface), MerchantsFlyer (commerce flavor / potential lead generator).
    - NPC: TownCrier (broadcast narrative beats / quest hooks).

Design Notes:
    - Orientation gating reinforces map discovery loop from GreendaleGates.
    - Consider consolidating navigation unlock into a shared MapUnlockController if multiple settlements added later.
"""

from ...engine.Room import Room
from ...engine.GameState import GameState
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
        self.city_map_used = False

    def get_exits(self, game_state: GameState) -> dict:
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
