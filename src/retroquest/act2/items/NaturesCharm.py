"""Nature's Charm (Act II Sacred Item)

Narrative Role:
    One of the triad of sacred charms (with DruidicCharm and ProtectiveCharm) necessary to complete the Offering
    Altar ritual summoning Nyx—manifestation of ancient forest agency.

Key Mechanics / Interactions:
    - use_with delegates to OfferingAltar for centralized ritual validation & execution.
    - Passive otherwise; generic carrying confers no direct stat or flag effect pre-ritual.

Story Flags:
    - Sets: (none)
    - Reads: (none)

Progression Effects:
    Required ritual component enabling Nyx encounter; opens narrative channels for trials, lore, or future spell access.

Design Notes:
    - Maintains symmetry with other charm implementations; avoids bespoke logic proliferation.
    - Could receive optional synergy messaging in a future enhancement if inspected with other charms present.
"""

from ...engine.Item import Item
from ...engine.GameState import GameState

class NaturesCharm(Item):
    def __init__(self) -> None:
        super().__init__(
            name="nature's charm",
            description=(
                "An ancient charm blessed by the knights of old, carved from living wood and inlaid with silver runes. "
                "It pulses with a gentle green light and seems to resonate with the natural world. This is clearly one of "
                "the sacred charms mentioned in the old texts - those needed to summon the forest sprite Nyx."
            )
        )

    def use_with(self, game_state: 'GameState', other_item) -> str:
        from ..items.OfferingAltar import OfferingAltar
        if isinstance(other_item, OfferingAltar):
            return other_item.use_with(game_state, self)
        return super().use_with(game_state, other_item)
