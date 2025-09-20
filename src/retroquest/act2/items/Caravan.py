"""Rescued Caravan (Act II Outcome Item)

Narrative Role:
    Manifestation of successful ravine rescue sequence; provides tangible aftermath object anchoring merchant gratitude.

Key Mechanics / Interactions:
    - Non-carriable static item added after Quality Rope rescue.
    - examine() supplies atmospheric confirmation and potential segue to reward distribution / trade enablement.

Story Flags:
    - Sets/Reads: (none here) — assumes FLAG_FOUND_LOST_CARAVAN already set by rope interaction.

Progression Effects:
    Enables merchant-related follow-ups (discounts, reputation, delivery of lost documents, etc.).

Design Notes:
    - Could expand with dynamic state (triage complete, goods inventoried) tracked by incremental flags if extended sequence desired.
"""

from ...engine.Item import Item

class Caravan(Item):
    def __init__(self) -> None:
        super().__init__(
            name="caravan",
            short_name="caravan",
            description=(
                "The rescued merchant caravan, battered but intact. Several merchants "
                "huddle around their damaged wagon, grateful to be alive. Their faces "
                "show relief mixed with exhaustion from their ordeal in the ravine. "
                "Crates of goods are scattered around, some damaged but most "
                "salvageable."
            ),
            can_be_carried=False,  # A caravan is too large to carry
        )

    def examine(self, _game_state) -> str:  # type: ignore[override]
        return (
            "The merchant caravan is in rough shape but the people are safe. The wagon's "
            "wheels are cracked and the canvas cover is torn, but the structure is sound. "
            "Several merchants tend to minor injuries while sorting through their goods. "
            "You see spice containers, bolts of fine cloth, and various trade items. The "
            "merchants look at you with deep gratitude—you clearly saved their lives."
        )
