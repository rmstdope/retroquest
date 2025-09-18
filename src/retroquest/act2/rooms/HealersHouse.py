"""Healer's House (Act II)

Narrative Role:
    Safe restorative enclave and progression anchor for advanced healing knowledge (MasterHealerLyria interactions).

Key Mechanics:
    - Tracks emergency_healing_used (local boolean) for potential one-time assistance pattern (future hook).
    - Currently no custom search/exit gating; functions as thematic support location.

Story Flags:
    - None at present (future enhancements may tie healing milestones to flags).

Contents:
    - NPC: MasterHealerLyria (likely conduit for healing-related spells or quests).
    - Items: None static; ambiance conveyed textually.

Design Notes:
    - Local state variable reserved for expansion; when implemented ensure consistent naming (e.g., FLAG_EMERGENCY_HEAL_USED) if promoted to story scope.
    - Could offer conditional rest or cure actions integrated via character methods rather than room logic.
"""

from ...engine.Room import Room
from ..characters.MasterHealerLyria import MasterHealerLyria

class HealersHouse(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Healer's House",
            description=(
                "A cozy cottage filled with the scents of medicinal herbs and healing potions. Dried plants hang from "
                "the rafters, and shelves line the walls, packed with bottles of various sizes and colors. A warm fire "
                "crackles in the hearth, and comfortable chairs invite rest and recovery. This is clearly a place of "
                "healing and learning."
            ),
            items=[],
            characters=[MasterHealerLyria()],
            exits={"south": "ResidentialQuarter"}
        )
        self.emergency_healing_used = False
