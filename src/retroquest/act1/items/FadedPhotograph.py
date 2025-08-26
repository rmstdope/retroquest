from ...engine.Item import Item
from ...engine.GameState import GameState
from ..Act1StoryFlags import FLAG_READ_PHOTO_MESSAGE
from typing import Any

class FadedPhotograph(Item):
    def __init__(self) -> None:
        super().__init__(
            name="faded photograph",
            short_name="photograph",
            description="An old, faded photograph. The image is barely visible, but you can make out two adults and a child. On the back, in your mother's handwriting, is a cryptic message: [dialogue]Seek the truth where the river bends.[/dialogue]",
            can_be_carried=True
        )

    def examine(self, game_state: GameState) -> str:
        game_state.set_story_flag(FLAG_READ_PHOTO_MESSAGE, True)
        return super().examine(game_state)

