"""Chicken Coop (Act I)

Narrative Role:
    Light agricultural micro-location providing early harmless creature ambiance and small collectible resources.

Key Mechanics:
    - Static configuration; description hints at hidden secret (future search or inspect hook candidate).

Story Flags:
    - None currently; collection or care systems could introduce them later.

Contents:
    - Items: Chicken (creature object), Egg (food / trade), Feather (crafting/brewing potential).
    - Characters: None (chickens modeled as items rather than NPCs for simplicity).

Design Notes:
    - Consider whether Chicken should become a Character if behavior/emotion systems are added.
    - Hidden hint provides low-cost expansion path for a mini-quest (lost trinket, golden egg, etc.).
"""

from ...engine.Room import Room
from ..items.Egg import Egg
from ..items.Feather import Feather
from ..items.Chicken import Chicken

class ChickenCoop(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Chicken Coop",
            description=(
                "A small wooden coop stands here, its planks patched and weathered. Nervous chickens "
                "cluck and flutter, their feathers ruffled as they dart between straw nests. The air is "
                "thick with the scent of hay and the occasional squawk. Sunbeams slip through the slats, "
                "casting striped shadows on the dirt floor. Something glints beneath the straw, hinting at "
                "a hidden secret."
            ),
            items=[Chicken(), Egg(), Feather()],
            characters=[],
            exits={"north": "VegetableField"}
        )
