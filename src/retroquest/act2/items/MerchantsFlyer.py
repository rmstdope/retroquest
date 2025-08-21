from ...engine.GameState import GameState
from ...engine.Item import Item

class MerchantsFlyer(Item):
    def __init__(self) -> None:
        super().__init__(
            name="merchant's flyer",
            description="A colorful handbill advertising the Market District's finest merchants and their premium goods. It features a special introduction coupon for new customers seeking quality adventure gear.",
            can_be_carried=True,
        )

    def use(self, game_state: GameState) -> str:
        return "You examine the merchant's flyer. It advertises quality goods from Master Merchant Aldric and would serve as a good introduction when visiting the Market District."