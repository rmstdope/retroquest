from .Item import Item

class Coin(Item):
    def __init__(self) -> None:
        super().__init__(
            name="coin",
            description="A small, circular piece of metal, likely used as currency. It has a simple stamp on one side.",
            short_name="coin",
            can_be_carried=True
        )

    def use(self, game_state) -> str:
        return "You flip the coin in the air. It lands heads up. Seems like a regular coin, perhaps for trading."
