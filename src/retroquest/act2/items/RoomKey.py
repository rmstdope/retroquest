from ...engine.GameState import GameState
from ...engine.Item import Item

class RoomKey(Item):
    def __init__(self) -> None:
        super().__init__(
            name="room key",
            description="A brass key to a private room at The Silver Stag Inn. The room provides a quiet space for studying and safe storage of important items.",
            can_be_carried=True,
        )

    def use(self, game_state: GameState) -> str:
        return "You examine the room key. It grants access to a private room at The Silver Stag Inn where you can study in peace and store valuable items safely."