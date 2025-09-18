"""Abandoned Shed (Act I)

Narrative Role:
    Early micro-dungeon style container offering multi-step interaction: unlock -> search -> loot staging.

Key Mechanics:
    - unlock(): Toggles locked state, injects MysteriousBox + BrokenShovel.
    - search(): While unlocked, first run adds FishingRod + Magnet (room_searched flag ensures idempotence).
    - Locked state blocks meaningful search feedback reinforcing tool discovery order.

Story Flags:
    - None yet; internal booleans (locked, room_searched) handle progression. Could elevate lock state to a flag if other rooms react.

Contents:
    - Items (initial): ShedDoor (implicit lock object).
    - Items (on unlock): MysteriousBox, BrokenShovel.
    - Items (on first search post-unlock): FishingRod, Magnet.
    - Characters: None.

Design Notes:
    - Exemplifies staged revelation pattern; reusable via a LockableLootRoom abstraction if pattern repeats.
    - Consider moving narrative strings to constants for localization scalability.
"""

from ...engine.Room import Room
from ..items.BrokenShovel import BrokenShovel
from ..items.MysteriousBox import MysteriousBox
from ..items.FishingRod import FishingRod # Import FishingRod
from ..items.Magnet import Magnet # Import Magnet
from ..items.ShedDoor import ShedDoor
from ...engine.GameState import GameState

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
            "A [item_name]Mysterious Box[/item_name] sits on a rickety table, and a [item_name]Broken Shovel[/item_name] leans against a cobweb-covered wall."
        )

    def search(self, game_state: GameState, target: str = None) -> str:
        if self.locked:
            return "You take a look around the shed. Nothing! The [item_name]Shed Door[/item_name] is locked so you can't search inside."

        items_found_messages = []
        
        if not self.room_searched:
            self.add_item(FishingRod())
            self.room_searched = True
            items_found_messages.append("a discarded [item_name]Fishing Rod[/item_name]")
            self.add_item(Magnet())
            items_found_messages.append("a small [item_name]Magnet[/item_name]")

        if items_found_messages:
            return f"You rummage through the clutter of rusty tools and broken crates. Tucked away in dusty corners, you find {', and '.join(items_found_messages)}!"
        else:
            return "You search around the shed again, but find nothing else of interest among the clutter."
