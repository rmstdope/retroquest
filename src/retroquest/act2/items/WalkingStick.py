from ...engine.GameState import GameState
from ...engine.Item import Item
from ..Act2StoryFlags import FLAG_HELPED_ELDERLY_RESIDENTS

class WalkingStick(Item):
    def __init__(self) -> None:
        super().__init__(
            name="walking stick",
            short_name="stick",
            description="A sturdy wooden walking stick worn smooth by many travelers. It provides reliable support on mountain paths and could serve as a makeshift weapon if needed.",
            can_be_carried=True,
        )

    def use(self, game_state: GameState) -> str:
        return "You lean on the walking stick, feeling more stable on the rocky mountain path. It's a trustworthy companion for any journey."
