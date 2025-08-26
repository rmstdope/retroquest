from ...engine.GameState import GameState
from ...engine.Item import Item
from .Well import Well
from .ShinyRing import ShinyRing
from typing import Any

class ExtendedMagneticFishingRod(Item):
    def __init__(self) -> None:
        super().__init__(
            name="extended magnetic fishing rod",
            description="A long fishing rod with a magnet on the end, reinforced with a sturdy stick. Perfect for reaching and retrieving metallic items from a distance."
        )

    def use_with(self, game_state: Any, other_item: Any) -> str:
        if isinstance(other_item, Well):
            event_msg = f"[event]You try to use the [item_name]{self.get_name()}[/item_name] with the [item_name]{other_item.get_name()}[/item_name].[/event]\n"
            if other_item.is_purified and other_item.contains_ring:
                # Remove self from inventory
                if self in game_state.inventory:
                    game_state.inventory.remove(self)
                
                # Add ShinyRing to inventory
                ring = ShinyRing()
                game_state.inventory.append(ring)
                
                # Update well state
                other_item.contains_ring = False
                
                return event_msg + f"After some careful maneuvering, you manage to retrieve a [item_name]{ring.get_name()}[/item_name]!"
            elif not other_item.is_purified:
                return event_msg + f"The water in the [item_name]{other_item.get_name()}[/item_name] is too murky. You can't see anything to retrieve."
            elif not other_item.contains_ring:
                return event_msg + f"You can see the bottom of the [item_name]{other_item.get_name()}[/item_name] clearly, but there's nothing metallic to retrieve with the [item_name]{self.get_name()}[/item_name]."
            else:
                return event_msg + f"You try to use the [item_name]{self.get_name()}[/item_name] with the [item_name]{other_item.get_name()}[/item_name], but it doesn't seem to work right now."
        return super().use_with(game_state, other_item)
