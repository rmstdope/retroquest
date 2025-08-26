from ...engine.GameState import GameState
from ...engine.Item import Item

class Rope(Item):
    def __init__(self) -> None:
        super().__init__(
            name="rope",
            description="A long, sturdy coil of rope. Useful for climbing, tying, or hauling things."
        )
    
    def prevent_pickup(self) -> str | None:
        """Shopkeeper prevents taking the rope unless it's been purchased."""
        if not self.can_be_carried_flag:
            return f"[character_name]Shopkeeper[/character_name] quickly steps over. [dialogue]'Hold on there, friend! That [item_name]{self.get_name()}[/item_name] is merchandise, not a free sample. If you want it, you'll need to buy it proper-like.'[/dialogue]"
        return None  # Allow pickup if can_be_carried is True
    
    def use_with(self, game_state: GameState, other_item: Item) -> str:
        from .Mechanism import Mechanism
        if isinstance(other_item, Mechanism):
            # Delegate to the Mechanism's use_with method
            return other_item.use_with(game_state: GameState, self)
        return super().use_with(game_state: GameState, other_item)
