"""Road to Greendale (Act I)

Narrative Role:
    Transitional outbound route signaling shift from sheltered village life to broader regional journey.

Key Mechanics:
    - Simple linear exit design; staging area for encounter or travel preparation events.

Story Flags:
    - None currently; future travel milestones or ambush events could attach here.

Contents:
    - Items: RustySaw (tool), potential TravelCloak (import present but not currently added—candidate for inclusion or removal),
      enabling light equipment provisioning.
    - NPC: Merchant (economic teaser / bridge to larger markets in Act II).

Design Notes:
    - Consider adding conditional exit enabling once certain village quests complete to reinforce narrative readiness.
    - Review unused TravelCloak import if item intentionally withheld (maybe reward gating) to avoid confusion.
"""

from ...engine.Room import Room
from ..items.RustySaw import RustySaw
from ..characters.Merchant import Merchant

class RoadToGreendale(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Road to Greendale",
            description=(
                "The main road leaving Willowbrook stretches beneath ancient oaks, their branches arching "
                "overhead like a living tunnel. The path is well-trodden, lined with wildflowers and "
                "scattered leaves. A merchant's cart creaks nearby, and the air is filled with the promise "
                "of adventure and the unknown. The road beckons, leading onward to new lands and new "
                "stories."
            ),
            items=[RustySaw()],
            characters=[Merchant()],
            exits={"west": "VillageChapel"}
        )
