"""Silver Leaves (Act II Forest Component Item)

Narrative Role:
	Luminous foliage fragment from ancient forest canopies (possibly the Silver-Barked Tree environs). Serves as a
	subtle collectible underscoring the forest's mystical photic qualities and potential ritual reagent availability.

Key Mechanics / Interactions:
	- Passive carriable item; no special use() logic yet.
	- examine() (inherited if not overridden) will show description; future enhancement could add location-reactive glow.

Story Flags:
	- Sets/Reads: (none)

Progression Effects:
	None currently—candidate for later crafting, ward augmentations, or barter with magical NPCs.

Design Notes:
	- Minimal now to preserve forward design optionality; keep naming consistent with potential item sets (e.g., Moonflowers synergy).
"""

from ...engine.Item import Item


class SilverLeaves(Item):
	def __init__(self) -> None:
		super().__init__(
			name="silver leaves",
			description=(
				"Delicate leaves that shimmer with a soft argent sheen even in shadow. Their surfaces refract light "
				"into faint auroral threads, and a cool, clean scent clings to them. Holding them you sense tranquil, "
				"ancient vitality."
			),
			can_be_carried=True,
		)
