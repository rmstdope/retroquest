from .Item import Item
from .Magnet import Magnet
from .MagneticFishingRod import MagneticFishingRod

class FishingRod(Item):
    def __init__(self):
        super().__init__(
            name="fishing rod",
            description="A simple fishing rod. It looks a bit flimsy.",
            can_be_carried=True
        )

    def use_with(self, game_state, other_item):
        if isinstance(other_item, Magnet):
            # Remove self (FishingRod) and Magnet from inventory
            if self in game_state.inventory:
                game_state.inventory.remove(self)
            if other_item in game_state.inventory:
                game_state.inventory.remove(other_item)
            
            # Add MagneticFishingRod to inventory
            magnetic_rod = MagneticFishingRod()
            game_state.inventory.append(magnetic_rod)
            return f"You attach the [item.name]{other_item.get_name()}[/item.name] to the [item.name]{self.get_name()}[/item.name], creating a [item.name]{magnetic_rod.get_name()}[/item.name]."
        
        from .River import River # Add local import here
        if isinstance(other_item, River): # Check if the other_item is a River
            return other_item.use_with(game_state, self) # Call River's use_with method
            
        from .Well import Well # Local import for Well
        if isinstance(other_item, Well):
            return "You try fishing in the [item.name]well[/item.name], but the [item.name]rod[/item.name] is too short to reach the water."

        return super().use_with(game_state, other_item) # Fallback to base class
