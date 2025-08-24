from ...engine.Room import Room
from ...engine.GameState import GameState
from ..items.MountainFlower import MountainFlower
from ..items.WalkingStick import WalkingStick
from ..items.CampSite import CampSite
from ..characters.MountainHermit import MountainHermit
from ..Act2StoryFlags import FLAG_SUPPLIES_QUEST_COMPLETED

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

    def get_exits(self, game_state: GameState) -> dict:
        """Return available exits, only showing forest transition if supplies quest is completed"""
        exits = super().get_exits(game_state).copy()
        if not game_state.get_story_flag(FLAG_SUPPLIES_QUEST_COMPLETED):
            exits.pop("east", None)
        return exits
