from ...engine.GameState import GameState
from ...engine.Item import Item

class Coins(Item):
    def __init__(self, amount: int = 100) -> None:
        self.amount = amount
        super().__init__(
            name="coins",
            description=f"A pouch containing {amount} gold coins. These will be useful for purchasing supplies and equipment in Greendale.",
            can_be_carried=True,
        )

    def use(self, game_state: GameState) -> str:
        return f"You count your coins. You have {self.amount} gold pieces to spend on supplies and equipment."

    def spend(self, amount: int) -> bool:
        """Spend coins if enough are available"""
        if self.amount >= amount:
            self.amount -= amount
            self.description = f"A pouch containing {self.amount} gold coins. These will be useful for purchasing supplies and equipment in Greendale."
            return True
        return False

    def get_amount(self) -> int:
        return self.amount