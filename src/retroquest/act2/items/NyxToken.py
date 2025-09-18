"""Nyx's Token (Act II Reward Item)

Narrative Role:
    Symbol of favor granted by Nyx after a successful summoning or trial sequence. Marks the player as a steward
    of enchanted balance and may serve as a credential for future forest guardians or planar thresholds.

Key Mechanics / Interactions:
    - Currently passive; no active use() logic—acts as a narrative badge / potential dialogue branch key.
    - Could later enable reduced hostility, shortcut traversal, or ritual augmentation.

Story Flags:
    - Sets: (none directly)
    - Reads: (none)

Progression Effects:
    Represents narrative advancement past Nyx encounter; future content can query possession to unlock optional paths.

Design Notes:
    - Keep item simple until downstream systems (relationship tiers, guardian diplomacy) are implemented.
    - Consider persistent flag (e.g., FLAG_RECEIVED_NYX_TOKEN) if item loss/drop mechanics are ever introduced.
"""

from ...engine.Item import Item

class NyxToken(Item):
    def __init__(self) -> None:
        super().__init__(
            name="nyx's token",
            description=(
                "A small, crystalline pendant that shifts through all the colors of nature - from the deep "
                "green of summer leaves to the golden brown of autumn, the pure white of winter snow, and the "
                "vibrant colors of spring flowers. It pulses with gentle magic and seems to contain a fragment "
                "of the forest's eternal essence."
            )
        )
