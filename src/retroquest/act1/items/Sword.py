from ...engine.Item import Item
from ...engine.GameState import GameState

class Sword(Item):
    def __init__(self) -> None:
        super().__init__(
            name="sword",
            description="A well-balanced iron sword with a sharp edge. The blade gleams with a faint sheen, and the leather-wrapped handle feels comfortable in your grip.",
            short_name="sword"
        )

    def use(self, game_state: GameState) -> str:
        return "[event]You examine the [item_name]sword[/item_name]. It feels perfectly balanced and ready for combat.[/event]"

    def equip(self, game_state: GameState) -> str:
        return "[event]You grip the [item_name]sword[/item_name] firmly. You feel more confident and prepared for any threats.[/event]"

    def examine(self, game_state: GameState) -> str:
        return "[event]You examine the [item_name]sword[/item_name]. " + self.description + "[/event]"
