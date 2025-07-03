from ...engine.GameState import GameState

from ...engine.Item import Item

class AncientAmulet(Item):
    def __init__(self) -> None:
        super().__init__(
            name="ancient amulet",
            description="A mysterious amulet inscribed with runes. It glows faintly and feels powerful to the touch.",
            short_name="amulet"
        )
    
    def prevent_pickup(self) -> str | None:
        """Mira prevents Elior from taking the ancient amulet before he's ready."""
        return "[character_name]Mira[/character_name] places a protective hand over the [item_name]amulet[/item_name]. [dialogue]'This is not yet yours to claim, [character_name]Elior[/character_name]. The [item_name]Ancient Amulet[/item_name] is a powerful artifact that must be earned through preparation and wisdom. Complete your journey preparations first, and it shall be yours.'[/dialogue]"
