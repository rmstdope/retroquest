"""Riverbank (Act I)

Narrative Role:
    Serene natural edge space enabling early meditative pacing and introduction of fishing thematic.

Key Mechanics:
    - Static layout; potential future fishing system integration point (Fisherman NPC anchor).

Story Flags:
    - None currently; fishing progression or environmental events could introduce them later.

Contents:
    - Items: SmoothStone (collectible/flavor), River (environment object possibly enabling verbs like 'fish', 'fill').
    - NPC: Fisherman (tutorialization or quest hook for gathering/crafting loops).

Design Notes:
    - Consider dynamic time-of-day description variants to reinforce tranquility.
    - Could tie into rare catch events unlocked by story milestones.
"""

from ...engine.Room import Room
from ..items.SmoothStone import SmoothStone
from ..items.River import River  # Import River
from ..characters.Fisherman import Fisherman

class Riverbank(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Riverbank",
            description=(
                "A gentle river flows past the village. Reeds sway along the banks, and the air is alive with the hum of insects. "
                "A weathered fisherman sits nearby, humming a quiet tune. The riverbank is peaceful, a place where time seems to slow and worries drift away."
            ),
            items=[SmoothStone(), River()],
            characters=[Fisherman()],
            exits={"west": "OldMill", "south": "ForestPath"}
        )
