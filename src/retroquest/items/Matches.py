from .Item import Item

class Matches(Item):
    def __init__(self) -> None:
        super().__init__(
            name="matches",
            description="A small box of matches. Useful for lighting fires, candles, or lanterns.",
            can_be_carried=True
        )

    def use_with(self, game_state, other_item) -> str:
        from .Candle import Candle # Moved import here and updated path
        if isinstance(other_item, Candle):
            # Call the Candle's use_with method, passing these matches
            return other_item.use_with(game_state, self)
        return super().use_with(game_state, other_item)
