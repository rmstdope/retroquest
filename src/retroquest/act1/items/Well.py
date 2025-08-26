from ...engine.GameState import GameState
from ...engine.Item import Item
from ..Act1StoryFlags import FLAG_WELL_EXAMINED
from typing import Any

class Well(Item):
    def __init__(self) -> None:
        super().__init__(
            name="well",
            description="An old stone well, its surface worn smooth. A frayed rope hangs nearby, disappearing into the depths.",
        )
        self.contains_ring = True  # The well initially contains the ring
        self.is_purified = False

    def examine(self, game_state: GameState) -> str:
        game_state.set_story_flag(FLAG_WELL_EXAMINED, True)
        base_desc = "An old stone well, its surface worn smooth. A frayed rope hangs nearby, disappearing into the depths."
        if self.is_purified:
            if self.contains_ring:
                self.description = f"{base_desc} The water within is crystal clear. You can see something shiny at the bottom, but it's still too deep to reach by hand."
            else: # Purified, but ring taken or was never there and now visible
                self.description = f"{base_desc} The water within is crystal clear. The bottom is visible and appears empty."
        else: # Not purified
            desc = f"{base_desc} The water below is dark and still. A foul stench rises from the depths, making your stomach churn. Something is very wrong here."
            if self.contains_ring: # Even if not purified, hint if ring is there
                desc += " You think you see something shiny deep within the murky water, but it's impossible to tell for sure or reach."
            self.description = desc
        return super().examine(game_state)

    def use_with(self, game_state: GameState, other_item: Item) -> str:
        from .Bucket import Bucket  # Local import to avoid circular dependency
        from .FishingRod import FishingRod  # Local import to avoid circular dependency
        from .MagneticFishingRod import MagneticFishingRod  # Local import to avoid circular dependency
        from .ExtendedMagneticFishingRod import ExtendedMagneticFishingRod  # Local import to avoid circular dependency      
        # Check if other_item is an instance of any of the classes in the tuple
        if isinstance(other_item, (Bucket, FishingRod, MagneticFishingRod, ExtendedMagneticFishingRod)):
            return other_item.use_with(game_state, self)
        
        return super().use_with(game_state, other_item)

    def search(self, game_state: GameState) -> str:
        if self.is_purified:
            if self.contains_ring:
                return "[event]You peer into the crystal clear water. A [item_name]shiny ring[/item_name] glints at the bottom, tantalizingly out of reach by hand.[/event]"
            else:
                return "[event]You peer into the crystal clear water. The bottom is visible and empty.[/event]"
        else: # Not purified
            if self.contains_ring:
                return "[failure]You peer into the murky depths. It's hard to see clearly, but you think you catch a glimpse of something shiny. It's far too deep to reach.[/failure]"
            else: # Not purified and no ring (e.g. if it was somehow removed before purification)
                return "[failure]You peer into the murky depths. It's too dark and unclear to see anything of interest.[/failure]"

    def purify(self, game_state: GameState) -> str:
        if not game_state.get_story_flag(FLAG_WELL_EXAMINED):
            return f"[failure]You hesitate. Why would you cast [spell_name]purify[/spell_name] on the [item_name]{self.get_name()}[/item_name]? Perhaps you should examine it first.[/failure]"
        if self.is_purified:
            return f"[failure]The [item_name]{self.get_name()}[/item_name] is already pure. The water is crystal clear.[/failure]"
        

        self.is_purified = True
        if self.contains_ring:
            # The ShinyRing is not added to the room here.
            # It's retrieved by the ExtendedMagneticFishingRod.
            return f"[event]You cast [spell_name]purify[/spell_name] on the [item_name]{self.get_name()}[/item_name]. The murky water shimmers and clears! You can now see a [item_name]shiny ring[/item_name] at the bottom, but it's still too deep to reach by hand.[/event]"
        else:
            # This case implies the ring was already taken or never there,
            # and the well is now being purified.
            return f"[event]You cast [spell_name]purify[/spell_name] on the [item_name]{self.get_name()}[/item_name]. The murky water shimmers and clears! The bottom is visible, but there's nothing of interest.[/event]"
