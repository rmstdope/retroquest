from .Room import Room
from ..items.BrokenShovel import BrokenShovel
from ..items.MysteriousBox import MysteriousBox
from ..items.FishingRod import FishingRod # Import FishingRod
from ..items.Magnet import Magnet # Import Magnet
from ..items.ShedDoor import ShedDoor

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
            items=[ShedDoor()], # Items are added dynamically
            characters=[],
            exits={"north": "VillageWell", "south": "OldMill"}
        )
        self.locked = True # The shed starts locked
        self.room_searched = False

    def unlock(self) -> str:
        if not self.locked:
            return "The shed is already unlocked."
        
        self.locked = False
        self.add_item(MysteriousBox())
        self.add_item(BrokenShovel())
        return (
            "The old wooden door creaks open with a groan, revealing the dusty interior of the Abandoned Shed. "
            "A [item.name]Mysterious Box[/item.name] sits on a rickety table, and a [item.name]Broken Shovel[/item.name] leans against a cobweb-covered wall."
        )

    def search(self, game_state) -> str:
        if self.locked:
            return "You take a look around the shed. Nothing! The [item.name]Shed Door[/item.name] is locked so you can't search inside."

        items_found_messages = []
        
        if not self.room_searched:
            self.add_item(FishingRod())
            self.room_searched = True
            items_found_messages.append("a discarded [item.name]Fishing Rod[/item.name]")
            self.add_item(Magnet())
            items_found_messages.append("a small [item.name]Magnet[/item.name]")

        if items_found_messages:
            return f"You rummage through the clutter of rusty tools and broken crates. Tucked away in dusty corners, you find {', and '.join(items_found_messages)}!"
        else:
            return "You search around the shed again, but find nothing else of interest among the clutter."
