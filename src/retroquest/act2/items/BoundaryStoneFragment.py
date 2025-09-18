"""Boundary Stone Fragment (Act II Lore Fragment Item)

Narrative Role:
	Shard of an ancient territorial or ley alignment marker once used to delineate protective forest boundaries.
	Hints at deeper geomantic infrastructure sustaining balance between civilized and wild domains.

Key Mechanics / Interactions:
	- Currently inert flavor collectible; no special use() override.
	- Could later combine with additional fragments to reconstruct a full warding stone (multi-part artifact pattern).

Story Flags:
	- Sets/Reads: (none)

Progression Effects:
	None now—seed for future optional restoration quest or environmental stabilizing ritual.

Design Notes:
	- Keep minimal until broader ley-line system or artifact assembly mechanic is introduced.
	- Naming aligns with potential set: BoundaryStoneFragmentA/B etc. if multiple needed later.
"""

from ...engine.Item import Item


class BoundaryStoneFragment(Item):
	def __init__(self) -> None:
		super().__init__(
			name="boundary stone fragment",
			description=(
				"A weathered shard of carved granite etched with faint, interlocking sigils. The lines form geometric "
				"patterns suggestive of containment or balance, though erosion has obscured portions of the design. "
				"A residual tingle of dormant warding magic lingers in the stone."
			),
			can_be_carried=True,
		)
