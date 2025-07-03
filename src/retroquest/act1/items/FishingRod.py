from ...engine.Item import Item
from .Magnet import Magnet
from .MagneticFishingRod import MagneticFishingRod
from ...engine.GameState import GameState

class FishingRod(Item):
    def __init__(self):
        super().__init__(
            name="fishing rod",
            short_name="rod",
            description="A simple fishing rod. It looks a bit flimsy.",
            can_be_carried=True
        )

    def use_with(self, game_state: GameState, other_item: Item) -> str:
        if isinstance(other_item, Magnet):
            # Only allow combining if the spell 'purify' is learned
            if game_state.has_spell('purify'):
                # Remove self (FishingRod) and Magnet from inventory
                if self in game_state.inventory:
                    game_state.inventory.remove(self)
                if other_item in game_state.inventory:
                    game_state.inventory.remove(other_item)
                
                # Add MagneticFishingRod to inventory
                magnetic_rod = MagneticFishingRod()
                game_state.inventory.append(magnetic_rod)
                return f"[event]You attach the [item_name]{other_item.get_name()}[/item_name] to the [item_name]{self.get_name()}[/item_name], creating a [item_name]{magnetic_rod.get_name()}[/item_name].[/event]"
            else:
                return ("[failure]You could force the magnet onto the rod, but it would likely prevent you from fishing — and you are really keen on doing some fishing![/failure]")

        from .River import River # Add local import here
        if isinstance(other_item, River): # Check if the other_item is a River
            return other_item.use_with(game_state, self) # Call River's use_with method
            
        from .Well import Well # Local import for Well
        if isinstance(other_item, Well):
            return "[failure]You try fishing in the [item_name]well[/item_name], but the [item_name]rod[/item_name] is too short to reach the water.[/failure]"

        return super().use_with(game_state, other_item) # Fallback to base class
