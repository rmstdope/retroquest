"""Village Square (Act I)

Narrative Role:
    Social and geographic hub of Willowbrook; introduces core ambient tone and early utility items (Bucket, OldNotice).

Key Mechanics:
    - No dynamic gating; serves as stable anchor for early navigation learning.
    - Provides flavor items that reinforce rural life and hint at future quests (notice board).

Story Flags:
    - None directly; early game relies on freeform exploration without progression locks here.

Contents:
    - Items: Bucket (utility / water interactions later), OldNotice (lore / hint surface).
    - NPC: Villager (generic social presence; potential dialogue hook foundation).

Design Notes:
    - Kept intentionally ungated to reduce friction during onboarding.
    - Could later host timed announcements or seasonal events without structural changes.
"""

from ...engine.Room import Room
from ..items.Bucket import Bucket
from ..items.OldNotice import OldNotice
from ..characters.Villager import Villager

class VillageSquare(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Village Square",
            description=(
                "The heart of Willowbrook bustles with life. Cobblestone paths radiate from a mossy old well, "
                "and a weathered notice board stands nearby, covered in faded announcements. Children chase "
                "each other around market stalls, and the air is filled with laughter, gossip, and the scent "
                "of fresh bread. The square is a crossroads for villagers, travelers, and secrets alike."
            ),
            items=[Bucket(), OldNotice()],
            characters=[Villager()],
            exits={"west": "EliorsCottage", "north": "MirasHut", "east": "GeneralStore"}
        )
