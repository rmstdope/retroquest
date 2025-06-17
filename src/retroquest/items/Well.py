from .Item import Item
# ShinyRing is not directly added by the well anymore, but its existence is tracked.
# from .ShinyRing import ShinyRing 

class Well(Item):
    def __init__(self):
        super().__init__(
            name="well",
            description="An old stone well, its surface worn smooth. A frayed rope hangs nearby, disappearing into the depths.",
        )
        self.contains_ring = True  # The well initially contains the ring
        self.is_purified = False

    def get_description(self) -> str:
        base_desc = "An old stone well, its surface worn smooth. A frayed rope hangs nearby, disappearing into the depths."
        if self.is_purified:
            if self.contains_ring:
                return f"{base_desc} The water within is crystal clear. You can see a Shiny Ring at the bottom, but it's still too deep to reach by hand."
            else: # Purified, but ring taken or was never there and now visible
                return f"{base_desc} The water within is crystal clear. The bottom is visible and appears empty."
        else: # Not purified
            desc = f"{base_desc} The water below is dark and still."
            if self.contains_ring: # Even if not purified, hint if ring is there
                desc += " You think you see something shiny deep within the murky water, but it's impossible to tell for sure or reach."
            return desc

    def use_with(self, game_state, other_item):
        from .Bucket import Bucket  # Local import to avoid circular dependency
        from .FishingRod import FishingRod  # Local import to avoid circular dependency
        from .MagneticFishingRod import MagneticFishingRod  # Local import to avoid circular dependency
        from .ExtendedMagneticFishingRod import ExtendedMagneticFishingRod  # Local import to avoid circular dependency      
        # Check if other_item is an instance of any of the classes in the tuple
        if isinstance(other_item, (Bucket, FishingRod, MagneticFishingRod, ExtendedMagneticFishingRod)):
            return other_item.use_with(game_state, self)
        
        return f"The {self.get_name()} cannot be used with the {other_item.get_name()} in this way."

    def search(self, game_state) -> str:
        if self.is_purified:
            if self.contains_ring:
                return "You peer into the crystal clear water. A Shiny Ring glints at the bottom, tantalizingly out of reach by hand."
            else:
                return "You peer into the crystal clear water. The bottom is visible and empty."
        else: # Not purified
            if self.contains_ring:
                return "You peer into the murky depths. It's hard to see clearly, but you think you catch a glimpse of something shiny. It's far too deep to reach."
            else: # Not purified and no ring (e.g. if it was somehow removed before purification)
                return "You peer into the murky depths. It's too dark and unclear to see anything of interest."

    def purify(self, game_state) -> str:
        if self.is_purified:
            return f"The {self.get_name()} is already pure. The water is crystal clear."
        
        self.is_purified = True
        if self.contains_ring:
            # The ShinyRing is not added to the room here.
            # It's retrieved by the ExtendedMagneticFishingRod.
            return f"You cast Purify on the {self.get_name()}. The murky water shimmers and clears! You can now see a Shiny Ring at the bottom, but it's still too deep to reach by hand."
        else:
            # This case implies the ring was already taken or never there,
            # and the well is now being purified.
            return f"You cast Purify on the {self.get_name()}. The murky water shimmers and clears! The bottom is visible, but there's nothing of interest."
