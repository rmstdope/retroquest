from ...engine.Room import Room
from ...engine.GameState import GameState
from ..items.MountainFlower import MountainFlower
from ..items.WalkingStick import WalkingStick
from ..items.CampSite import CampSite
from ..characters.MountainHermit import MountainHermit

class MountainPath(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Mountain Path",
            description=(
                "A winding trail that leads through rocky terrain between Willowbrook and Greendale. "
                "Sturdy mountain trees provide occasional shade, and the path is well-maintained despite "
                "its remote location. You can see both settlements from various points along the trail, "
                "and the journey offers time for reflection on your adventures. A small camp site, often "
                "used by travelers, sits just off the main path."
            ),
            items=[MountainFlower(), WalkingStick(), CampSite()],
            characters=[MountainHermit()],
            exits={"north": "GreendaleGates", "east": "ForestTransition"}
        )
        self.forest_exit_locked = True

    def get_exits(self, game_state=None) -> dict:
        """Return available exits, hiding forest_transition if locked"""
        exits = super().get_exits().copy()
        if self.forest_exit_locked:
            exits.pop("east", None)
        return exits

    def unlock_forest_transition(self) -> None:
        """Unlock the path to the forest (called when appropriate quest conditions are met)"""
        self.forest_exit_locked = False
