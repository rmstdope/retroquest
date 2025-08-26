from typing import TYPE_CHECKING
from ...engine.Item import Item

if TYPE_CHECKING:
    from ...engine.Character import Character
    from ...engine.GameState import GameState

class SecretDocuments(Item):
    """Secret documents containing evidence that proves Sir Cedric's innocence."""
    
    def __init__(self) -> None:
        super().__init__(
            name="secret documents",
            description="A sealed envelope containing important legal documents and testimonies. The papers inside appear to be evidence related to a past court case.",
        )

    def examine(self, game_state: 'GameState') -> str:
        return ("The documents contain sworn testimonies and legal evidence proving that Sir Cedric was "
                "falsely accused of cowardice during a past battle. The papers show he was actually "
                "protecting civilians and following direct orders from his commanding officer. This "
                "evidence would completely clear his name and restore his honor.")

    def use(self, game_state: 'GameState') -> str:
        return ("These documents contain sensitive legal evidence. You should present them to the "
                "Lord Commander in the Great Hall to officially clear Sir Cedric's name.")
