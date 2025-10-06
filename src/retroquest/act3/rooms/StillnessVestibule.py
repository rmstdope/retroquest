"""Stillness Vestibule room for Act 3."""

from ...engine.Room import Room
from ...engine.GameState import GameState
from ..items.EchoStones import EchoStones
from ..items.StillwaterPhial import StillwaterPhial
from ..items.QuietCharm import QuietCharm
from ..characters.SilenceKeeper import SilenceKeeper
from ..Act3StoryFlags import FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED


class StillnessVestibule(Room):
    """A quiet chamber where hush falls over dark water pools."""

    def __init__(self) -> None:
        """Initialize Stillness Vestibule with description and exits."""
        super().__init__(
            name="Stillness Vestibule",
            description=(
                "A hush falls over dark water pools; sound seems to fold into the stone. "
                "Three echo stones stand in a triangle at the chamber's heart, their "
                "carved channels waiting to amplify whispered words."
            ),
            items=[
                EchoStones(),
                StillwaterPhial(),
                QuietCharm()
            ],
            characters=[SilenceKeeper()],
            exits={
                "north": "CollapsedGalleries", 
                "west": "CavernMouth"
            },
        )

    def get_exits(self, game_state: GameState) -> dict[str, str]:
        """Return exits, opening path to Dragon's Hall after Oath completion."""
        exits = self.exits.copy()
        # Only allow east to Dragon's Hall after Oath of Stillness is completed
        if game_state.get_story_flag(FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED):
            exits["east"] = "DragonsHall"
        return exits
