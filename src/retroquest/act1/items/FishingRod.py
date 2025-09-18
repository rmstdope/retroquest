"""FishingRod Item

Narrative Role:
Baseline tool that can be upgraded through combination, illustrating emergent crafting (rod + magnet) constrained by knowledge gating (spell requirement) and environmental versatility (river vs. well failure feedback).

Key Mechanics / Interactions:
- `use_with` + `Magnet` (only if player has learned spell 'purify') consumes both to create `MagneticFishingRod` (inventory transform pattern).
- Delegates interaction to `River` for fishing attempts; explicitly blocks well use with flavor fail.

Story Flags (Sets / Reads):
(none) – Spell possession check uses existing spell system, not flags.

Progression Effects:
- Introduces conditional crafting recipe reliant on spell progression.
- Sets pattern for multi-component upgrades leading to extended retrieval capacity (later extended magnetic variant synergy with well ring).

Design Notes:
- Could refactor into generic crafting service if recipes scale; current inline approach adequate for low volume.
- Prevents magnet attachment prematurely to preserve fishing utility until proper upgrade moment.

"""

from ...engine.Item import Item
from .Magnet import Magnet
from .MagneticFishingRod import MagneticFishingRod

class FishingRod(Item):
    def __init__(self) -> None:
        super().__init__(
            name="fishing rod",
            short_name="rod",
            description="A simple fishing rod. It looks a bit flimsy.",
            can_be_carried=True
        )

    def use_with(self, game_state, other_item: Item) -> str:
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
