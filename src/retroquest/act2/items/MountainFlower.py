from ...engine.GameState import GameState
from ...engine.Item import Item

class MountainFlower(Item):
    def __init__(self) -> None:
        super().__init__(
            name="mountain flower",
            description="A small but hardy wildflower that grows along the mountain paths. Its purple petals seem to shimmer slightly in the sunlight, though it appears to have no special properties.",
            can_be_carried=True,
        )

    def use(self, game_state: GameState) -> str:
        return "You examine the mountain flower closely. It's quite pretty, but seems to be just an ordinary wildflower that's adapted to the harsh mountain climate."
