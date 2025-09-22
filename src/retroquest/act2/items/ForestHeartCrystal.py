"""Forest Heart Crystal (Act II Key Artifact)

Narrative Role:
    High-tier natural magic artifact embodying the Enchanted Forest's living essence. Serves as a capstone reward
    or ritual component candidate, anchoring themes of balance, preservation, and ancient vitality.

Key Mechanics / Interactions:
    - Currently passive (no explicit use() override); functions as a symbolic / potential quest objective item.
    - Non-consumptive descriptive presence conveys power without immediate exploitation pathway.

Story Flags:
    - Sets: (none presently)
    - Reads: (none)

Progression Effects:
    Narrative milestone acquisition; may be leveraged in future acts for large-scale restoration, ward powering,
    or unlocking primordial spellcraft.

Design Notes:
    - Minimal implementation preserves flexibility—future systems can hook a dedicated ritual or stabilization mechanic.
    - Consider later adding a guarded acquisition sequence using multi-flag prerequisite pattern similar to forest gating.
"""

from ...engine.Item import Item

class ForestHeartCrystal(Item):
    """A powerful crystal embodying the living essence of the enchanted forest."""
    def __init__(self) -> None:
        super().__init__(
            name="forest heart crystal",
            description=(
                "A magnificent crystal that seems to contain an entire living forest within its translucent "
                "depths. Tiny lights dance inside like fireflies, and you can almost hear the whisper of wind "
                "through leaves when you hold it close. This crystal radiates immense magical power and "
                "represents the concentrated essence of all natural magic."
            )
        )
