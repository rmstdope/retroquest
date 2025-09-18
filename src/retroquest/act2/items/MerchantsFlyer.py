"""Merchant's Flyer (Act II Economy/Lore Item)

Narrative Role:
    Promotional handbill introducing Market District commerce ecosystem and hinting at premium outfitting opportunities.

Key Mechanics / Interactions:
    - Simple carriable reference; use() surfaces introductory flavor only.
    - Could later act as a credential enabling first-purchase discount or unlocking merchant dialogue branch.

Story Flags:
    - Sets/Reads: (none currently)

Progression Effects:
    Mild guidance tool pointing player toward supply acquisition phase; non-essential but supportive.

Design Notes:
    - Lightweight now; extensible by attaching a FLAG_PRESENTED_FLYER at merchant interaction site if needed.
"""

from ...engine.GameState import GameState
from ...engine.Item import Item

class MerchantsFlyer(Item):
    def __init__(self) -> None:
        super().__init__(
            name="merchant's flyer",
            short_name="flyer",
            description="A colorful handbill advertising the Market District's finest merchants and their premium goods. It features a special introduction coupon for new customers seeking quality adventure gear.",
            can_be_carried=True,
        )

    def use(self, game_state: GameState) -> str:
        return "You examine the merchant's flyer. It advertises quality goods from Master Merchant Aldric and would serve as a good introduction when visiting the Market District."