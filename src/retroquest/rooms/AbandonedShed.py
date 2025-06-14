from .Room import Room
from ..items.BrokenShovel import BrokenShovel
from ..items.MysteriousBox import MysteriousBox
from ..items.FishingRod import FishingRod # Import FishingRod

class AbandonedShed(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Abandoned Shed",
            description=(
                "A rickety shed leans precariously at the edge of Willowbrook, its weathered boards "
                "creaking in the wind. Rusty tools and broken crates are scattered about, and a thick "
                "layer of dust covers everything. Shadows gather in the corners, and the air smells of "
                "old earth and forgotten secrets. Something about the place feels both forlorn and "
                "mysteriously inviting."
            ),
            items=[BrokenShovel(), MysteriousBox()],
            characters=[],
            exits={"north": "VillageWell", "south": "OldMill"}
        )
        self.fishing_rod_found = False # Add a flag to track if the rod has been found

    def search(self, game_state) -> str:
        # General search of the Abandoned Shed
        if not self.fishing_rod_found:
            self.add_item(FishingRod())
            self.fishing_rod_found = True # Mark that the rod has been revealed by searching
            return "You rummage through the clutter of rusty tools and broken crates. Tucked away in a dusty corner, you find a discarded fishing rod!"
        else:
            # If the rod has already been found by searching this room
            return "You search around the shed again, but find nothing else of interest among the clutter."
