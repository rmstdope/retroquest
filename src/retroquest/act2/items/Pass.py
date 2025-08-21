from ...engine.GameState import GameState
from ...engine.Item import Item

class Pass(Item):
    def __init__(self) -> None:
        super().__init__(
            name="pass",
            description="An ornate document bearing your grandmother's seal and formal recommendation. This pass grants access to noble areas and provides formal recognition of your standing.",
            can_be_carried=True,
        )

    def use(self, game_state: GameState) -> str:
        return "You examine the pass from your grandmother. The formal seal and recommendation should grant you access to restricted areas and formal audiences with nobility."