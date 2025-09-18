"""Village Well (Act I)

Narrative Role:
    Central mystical-feeling utility structure; atmospheric locus for future purification or divination mechanics.

Key Mechanics:
    - Static exit hub with mild environmental intrigue; Well item enables water/purification interactions later.

Story Flags:
    - None yet; potential future flags for purified water, revealed secret, or wish events.

Contents:
    - Item: Well (interactive environmental object with likely custom verbs in expansion).
    - Characters: None—solitary ambiance preserved.

Design Notes:
    - Opportunity for early subtle foreshadowing of deeper magical systems.
    - Could spawn event-driven character (seer, spirit) after meeting certain cross-room conditions.
"""

from ...engine.Room import Room
from ..items.Well import Well

class VillageWell(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Village Well",
            description=(
                "An old stone well stands at the village's center, its stones worn smooth by countless "
                "hands. The water below glimmers with a crystalline clarity, and the air is cool and "
                "damp. Moss creeps up the sides, and a frayed rope hangs nearby. The well "
                "seems to whisper secrets to those who listen closely."
            ),
            items=[Well()],
            characters=[],
            exits={"west": "VegetableField", "east": "BlacksmithsForge", "south": "AbandonedShed"}
        )
