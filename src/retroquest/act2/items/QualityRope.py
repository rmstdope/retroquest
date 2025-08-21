from ...engine.GameState import GameState
from ...engine.Item import Item

class QualityRope(Item):
    def __init__(self) -> None:
        super().__init__(
            name="quality rope",
            description="Fifty feet of strong, reliable rope suitable for climbing, securing loads, and emergency situations. The rope is treated to resist weather and magical corrosion.",
            can_be_carried=True,
        )

    def use(self, game_state: GameState) -> str:
        return "You examine the quality rope. It's well-made and versatile - useful for climbing, rappelling, securing equipment, or any situation where strong, reliable rope is needed."