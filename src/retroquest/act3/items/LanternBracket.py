from ...engine.Item import Item
from ...engine.GameState import GameState


class LanternBracket(Item):
    def __init__(self) -> None:
        super().__init__(
            name="Lantern Bracket",
            description=(
                "A carved niche fitted with a brass bracket, sized for a prism lantern."
            ),
            short_name="bracket",
            can_be_carried=False,
        )
        self.has_lantern: bool = False

    def examine(self, game_state: GameState) -> str:
        if self.has_lantern:
            return "A prism lantern rests here, ready to be lit."
        return "An empty bracket waits for a lantern."
