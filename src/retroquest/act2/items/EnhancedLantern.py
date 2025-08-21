from ...engine.GameState import GameState
from ...engine.Item import Item

class EnhancedLantern(Item):
    def __init__(self) -> None:
        super().__init__(
            name="enhanced lantern",
            description="A magically enhanced lantern that burns with bright, steady light. The enchantment allows it to illuminate hidden paths and reveal magical auras that would otherwise remain invisible.",
            can_be_carried=True,
        )

    def use(self, game_state: GameState) -> str:
        return "You activate the enhanced lantern. Its magical light pierces through darkness and can reveal hidden passages, magical traces, and secret paths that ordinary light cannot illuminate."