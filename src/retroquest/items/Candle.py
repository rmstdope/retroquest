from ..items.Item import Item

class Candle(Item):
    def __init__(self) -> None:
        super().__init__(
            name="candle",
            description="A simple beeswax candle. It provides a warm, steady light and a faint, comforting scent.",           
            can_be_carried=True
        )
