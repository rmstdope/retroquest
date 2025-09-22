"""Entry Pass (Act II Item)

Narrative Role:
    Credential document enabling unchallenged passage through Greendale's gates. Functions as early-game
    access permission artifact rather than a reusable tool.

Key Mechanics / Interactions:
    - Simple carriable item; use() provides inspection flavor text only (no direct flag mutation here).
    - Actual gating/consumption (if any) expected to be handled by guard NPC dialogue or room transition logic.

Story Flags:
    - Sets: (none directly)
    - Reads: (none)

Progression Effects:
    Provides narrative justification for entering the city, potentially satisfying guard verification checks.

Design Notes:
    - Intentional minimal logic keeps cross-system dependency (guards) flexible.
    - If future design requires tracking presentation, a dedicated FLAG_PRESENTED_ENTRY_PASS could be added
      at the interaction site rather than here.
"""

from ...engine.GameState import GameState
from ...engine.Item import Item

class EntryPass(Item):
    """Credential document that grants passage through Greendale's gates."""
    def __init__(self) -> None:
        super().__init__(
            name="entry pass",
            short_name="pass",
            description="An official-looking document with the seal of Greendale. It appears to grant passage through the city gates to those who present it to the guards.",
            can_be_carried=True,
        )

    def use(self, _game_state: GameState) -> str:
        return "You examine the entry pass. The seal looks authentic, and it should allow you passage into Greendale without question."
