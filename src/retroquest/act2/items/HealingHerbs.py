"""Healing Herbs (Act II Resource Item)

Narrative Role:
    Foundational alchemical and medical component supporting healer training, potion crafting, or restorative spellwork.

Key Mechanics / Interactions:
    - use() provides contextual descriptive guidance (not currently consumed here).
    - Acts as a potential ingredient placeholder for future crafting or quest turn-ins.

Story Flags:
    - Sets/Reads: (none)

Progression Effects:
    Enables (implicitly) participation in healer-centric advancement; may become a requirement for training steps.

Design Notes:
    - Retained as non-consumptive until a defined crafting/consumption mechanic is introduced.
    - Could later support quantity stacking or integration with an inventory categorization system.
"""

from ...engine.GameState import GameState
from ...engine.Item import Item

class HealingHerbs(Item):
    def __init__(self) -> None:
        super().__init__(
            name="healing herbs",
            short_name="herbs",
            description="A bundle of carefully selected medicinal herbs known for their healing properties. These herbs are essential for advanced healing magic and potion-making.",
            can_be_carried=True,
        )

    def use(self, game_state: GameState) -> str:
        return "You examine the healing herbs. They are fresh and potent - perfect for use in advanced healing magic, training with Master Healer Lyria, or crafting powerful remedies."