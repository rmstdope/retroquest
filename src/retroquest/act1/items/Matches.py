from ...engine.GameState import GameState
from ...engine.Item import Item

class Matches(Item):
    def __init__(self) -> None:
        super().__init__(
            name="matches",
            description="A small box of matches. Useful for lighting fires, candles, or lanterns."
        )

    def prevent_pickup(self) -> str | None:
        """Shopkeeper prevents taking the matches unless they've been purchased."""
        if not self.can_be_carried_flag:
            return f"[character_name]Shopkeeper[/character_name] quickly steps over. [dialogue]'Hold on there, friend! That [item_name]{self.get_name()}[/item_name] is merchandise, not a free sample. If you want it, you'll need to buy it proper-like.'[/dialogue]"
        return None  # Allow pickup if can_be_carried is True

    def use_with(self, game_state, other_item) -> str:
        from .Candle import Candle # Moved import here and updated path
        if isinstance(other_item, Candle):
            # Call the Candle's use_with method, passing these matches
            return other_item.use_with(game_state, self)
        return super().use_with(game_state, other_item)
