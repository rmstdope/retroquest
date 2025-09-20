"""Walking Stick (Act II Utility / Flavor Item)

Narrative Role:
    Practical travel aid symbolizing preparedness for rugged terrain. Provides a subtle immersive anchor during
    mountain traversal segments.

Key Mechanics / Interactions:
    - use() outputs supportive flavor; no durability or mechanical buffs yet applied.

Story Flags:
    - Sets/Reads: (none)

Progression Effects:
    None directly; candidate for future minor movement bonuses or stability checks.

Design Notes:
    - Could integrate with an encumbrance or terrain challenge system (reduced stumble chance, etc.).
    - Retained intentionally simple pending broader traversal mechanics.
"""

from ...engine.GameState import GameState
from ...engine.Item import Item

class WalkingStick(Item):
    def __init__(self) -> None:
        super().__init__(
            name="walking stick",
            short_name="stick",
            description="A sturdy wooden walking stick worn smooth by many travelers. It provides reliable support on mountain paths and could serve as a makeshift weapon if needed.",
            can_be_carried=True,
        )

    def use(self, _game_state: GameState) -> str:
        return "You lean on the walking stick, feeling more stable on the rocky mountain path. It's a trustworthy companion for any journey."
