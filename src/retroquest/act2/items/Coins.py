"""Coins (Act II Economy Item)

Narrative Role:
    Core currency resource enabling acquisition of supplies, gear, and potentially quest services within Greendale.

Key Mechanics / Interactions:
    - Maintains internal mutable integer balance (self.amount) with spend() helper performing guarded decrements.
    - use() provides current balance feedback; description kept synchronized after each spend.
    - Functions as a single inventory item representing a pouch rather than discrete coin stacking.

Story Flags:
    - Sets/Reads: (none) — currency state isolated from narrative progression flags.

Progression Effects:
    Facilitates market interactions and preparation gates (e.g., purchasing survival gear) without directly unlocking narrative beats.

Design Notes:
    - If future systems require persistence across acts, consider migrating amount into GameState economy subsystem.
    - Potential extension: log transactions for quest auditing or introduce denominations.
"""

from ...engine.GameState import GameState
from ...engine.Item import Item

class Coins(Item):
    """Pouch-like currency item that tracks an integer coin balance."""
    def __init__(self, amount: int = 100) -> None:
        self.amount = amount
        super().__init__(
            name="coins",
            description=(
                f"A pouch containing {amount} gold coins. These will be useful for purchasing "
                f"supplies and equipment in Greendale."
            ),
            can_be_carried=True,
        )

    def use(self, _game_state: GameState) -> str:
        return (
            f"You count your coins. You have {self.amount} gold pieces to spend on "
            f"supplies and equipment."
        )

    def spend(self, amount: int) -> bool:
        """Spend coins if enough are available"""
        if self.amount >= amount:
            self.amount -= amount
            self.description = (
                f"A pouch containing {self.amount} gold coins. These will be useful for "
                f"purchasing supplies and equipment in Greendale."
            )
            return True
        return False

    def get_amount(self) -> int:
        """Return the current coin balance."""
        return self.amount
