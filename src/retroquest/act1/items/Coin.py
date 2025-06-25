from ...engine.GameState import GameState
from ...engine.Item import Item

class Coin(Item):
    def __init__(self) -> None:
        super().__init__(
            name="coin",
            description="A small, circular piece of metal, likely used as currency. It has a simple stamp on one side.",
            short_name="coin",
            can_be_carried=True
        )

    def use(self, game_state) -> str:
        return "[event]You flip the [item_name]coin[/item_name] in the air.[event]/nIt lands heads up. Seems like a regular [item_name]coin[/item_name], perhaps for trading."
