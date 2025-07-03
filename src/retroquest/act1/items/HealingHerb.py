from ...engine.GameState import GameState

from ...engine.Item import Item

class HealingHerb(Item):
    def __init__(self) -> None:
        super().__init__(
            name="healing herb",
            description="A bundle of fragrant green herbs, known for their restorative properties. Useful for healing wounds or brewing potions.",
            short_name="herb"
        )
    
    def prevent_pickup(self) -> str | None:
        """Mira prevents Elior from taking the healing herb."""
        return "[character_name]Mira[/character_name] gently but firmly stops you. [dialogue]'Those herbs are part of my stores, [character_name]Elior[/character_name]. They are not for taking, but for healing those who truly need them. If you require healing, simply ask.'[/dialogue]"
