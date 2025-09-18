"""Mira's Hut (Act I)

Narrative Role:
    Early magical/medical resource point introducing dual-purpose items (healing + mystical artifact) and mentor archetype.

Key Mechanics:
    - Static configuration; no dynamic exits or conditional search yet.
    - Provides HealingHerb (consumable) and AncientAmulet (mystic progression / potential protective trigger later).

Story Flags:
    - None presently; future interactions (teaching spells, blessing) could establish flags here.

Contents:
    - Items: HealingHerb, AncientAmulet.
    - NPC: Mira (potential spell tutor / quest giver).

Design Notes:
    - Serves as foundational node for later Act II healer expansion; maintain naming alignment (Healer's House vs. Hut) for clarity.
    - Consider adding context-sensitive guidance if player lacks basic recovery knowledge.
"""

from ...engine.Room import Room
from ..items.HealingHerb import HealingHerb
from ..items.AncientAmulet import AncientAmulet
from ..characters.Mira import Mira

class MirasHut(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Mira's Hut",
            description=(
                "A fragrant hut filled with drying herbs and mysterious potions. Shelves overflow with "
                "bottles, roots, and colorful flowers. The air is thick with the scent of lavender and "
                "sage. Sunlight streams through stained glass, painting the walls in shifting hues. Mira "
                "herself moves gracefully among her concoctions, her eyes bright with knowledge and "
                "kindness."
            ),
            items=[HealingHerb(), AncientAmulet()],
            characters=[Mira()],
            exits={"south": "VillageSquare"}
        )
