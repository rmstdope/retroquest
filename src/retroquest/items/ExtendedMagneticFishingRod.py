from .Item import Item
from .Well import Well
from .ShinyRing import ShinyRing

class ExtendedMagneticFishingRod(Item):
    def __init__(self):
        super().__init__(
            name="extended magnetic fishing rod",
            description="A long fishing rod with a magnet on the end, reinforced with a sturdy stick. Perfect for reaching and retrieving metallic items from a distance."
        )

    def use_with(self, game_state, other_item):
        if isinstance(other_item, Well):
            if other_item.is_purified and other_item.contains_ring:
                # Remove self from inventory
                if self in game_state.inventory:
                    game_state.inventory.remove(self)
                
                # Add ShinyRing to inventory
                ring = ShinyRing()
                game_state.inventory.append(ring)
                
                # Update well state
                other_item.contains_ring = False
                
                return f"You use the {self.get_name()} with the {other_item.get_name()}. After some careful maneuvering, you manage to retrieve a {ring.get_name()}!"
            elif not other_item.is_purified:
                return f"The water in the {other_item.get_name()} is too murky. You can't see anything to retrieve."
            elif not other_item.contains_ring:
                return f"You can see the bottom of the {other_item.get_name()} clearly, but there's nothing metallic to retrieve with the {self.get_name()}."
            else:
                return f"You try to use the {self.get_name()} with the {other_item.get_name()}, but it doesn't seem to work right now."
        return super().use_with(game_state, other_item)
