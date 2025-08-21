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

    def get_exits(self) -> dict:
        """Return available exits, hiding forest_transition if locked"""
        exits = super().get_exits().copy()
        if self.forest_exit_locked:
            exits.pop("east", None)
        return exits

    def unlock_forest_transition(self) -> None:
        """Unlock the path to the forest (called when appropriate quest conditions are met)"""
        self.forest_exit_locked = False

    def on_enter(self, game_state: GameState) -> str:
        """Called when player enters the room"""
        arrival_msg = super().on_enter(game_state)
        
        # Check if this is the first time arriving from Willowbrook
        if not game_state.get_flag("arrived_at_mountain_path"):
            game_state.set_flag("arrived_at_mountain_path", True)
            arrival_msg += ("\n\n[event]After your adventures in Willowbrook, you find yourself on the mountain "
                          "path leading to Greendale. The sight of the larger settlement ahead fills you with "
                          "both excitement and apprehension about the challenges that await.[/event]")
        
        return arrival_msg

    def search(self, game_state: GameState) -> str:
        """Allow searching the room for the camp site"""
        camp_site = None
        for item in self.items:
            if item.get_name() == "camp site":
                camp_site = item
                break
        
        if camp_site and not camp_site.searched:
            return camp_site.search(game_state)
        
        return "You search the mountain path carefully, but find nothing else of interest beyond what's already visible."
