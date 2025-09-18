"""Hidden Library (Act II)

Narrative Role:
    Secret subterranean archive revealed via search in ResidentialQuarter. Provides mid‑act lore
    expansion and defensive progression (Protective Enchantments) plus historical context (Ancient Chronicle).

Key Mechanics:
    - Access is gated externally: added as a reachable destination only after ResidentialQuarter search sets its flag.
    - Static configuration (no dynamic exits added here) keeps the moment of discovery localized to the originating room.

Story Flags:
    - Reads implicitly through being reachable only after FLAG_ANCIENT_LIBRARY_ACCEPTED (flag itself set elsewhere).
    - Does not set additional flags; serves as a reward / resource node.

Contents:
    - Items: AncientChronicle (lore), ProtectiveEnchantments (defensive gating item for forest progression).
    - NPC: SpectralLibrarian (exposition provider; future hook for advanced spell pedagogy).

Design Notes:
    - Kept minimal to spotlight the discovery event; extensible for future conditional dialogues or research mechanics.
"""

from ...engine.Room import Room
from ..characters.SpectralLibrarian import SpectralLibrarian
from ..items.AncientChronicle import AncientChronicle
from ..items.ProtectiveEnchantments import ProtectiveEnchantments

class HiddenLibrary(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Hidden Library",
            description=(
                "Discovered beneath Greendale through a secret passage, this ancient library contains countless volumes "
                "of magical lore. Glowing crystals provide soft illumination, and the air hums with residual magic. "
                "Protective enchantments shimmer around the most valuable texts. This repository of knowledge holds "
                "secrets that could unlock the mysteries of your destiny."
            ),
            items=[AncientChronicle(), ProtectiveEnchantments()],
            characters=[SpectralLibrarian()],
            exits={"secret_passage": "ResidentialQuarter"}
        )
