from ...engine.Room import Room
from ..characters.Mira import Mira
from ..characters.SirCedric import SirCedric
from ..items.HealingHerbs import HealingHerbs
from ..items.AncientAmulet import AncientAmulet
from ..items.TeleportationFocus import TeleportationFocus


class MirasHut(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Mira's Hut",
            description=(
                "A fragrant hut filled with drying herbs and mysterious potions. Shelves "
                "overflow with bottles, roots, and colorful flowers. The air is thick with "
                "the scent of lavender and sage. Sunlight streams through stained glass, "
                "painting the walls in shifting hues. Mira herself moves gracefully among "
                "her concoctions, her eyes bright with knowledge and kindness."
            ),
            items=[
                HealingHerbs(),
                AncientAmulet(),
                TeleportationFocus(),
            ],
            characters=[
                Mira(),
                SirCedric(),
            ],
            exits={},
        )
