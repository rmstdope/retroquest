from .Item import Item
from .Stick import Stick

class MagneticFishingRod(Item):
    def __init__(self):
        super().__init__(
            name="magnetic fishing rod",
            description="A fishing rod with a magnet attached to the end. Good for attracting metallic objects."
        )

    def use_with(self, game_state, other_item):
        # Circular import guard for ExtendedMagneticFishingRod
        from .ExtendedMagneticFishingRod import ExtendedMagneticFishingRod
        if isinstance(other_item, Stick):
            # Remove self (MagneticFishingRod) and Stick from inventory
            if self in game_state.inventory:
                game_state.inventory.remove(self)
            if other_item in game_state.inventory:
                game_state.inventory.remove(other_item)
            
            # Add ExtendedMagneticFishingRod to inventory
            extended_rod = ExtendedMagneticFishingRod()
            game_state.inventory.append(extended_rod)
            return f"You attach the [item.name]{other_item.get_name()}[/item.name] to the [item.name]{self.get_name()}[/item.name], creating an [item.name]{extended_rod.get_name()}[/item.name]."

        from .Well import Well # Local import for Well
        if isinstance(other_item, Well):
            return f"You try fishing in the [item.name]{other_item.get_name()}[/item.name], but the [item.name]{self.get_name()}[/item.name] is too short to reach the water."

        return super().use_with(game_state, other_item)
