from .Room import Room
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
            spells=["heal"],
            usable_items=["healing herb"],
            characters=[Mira()],
            exits={"south": "VillageSquare"}
        )
