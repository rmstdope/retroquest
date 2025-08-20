from ...engine.GameState import GameState
from ...engine.Item import Item

class TrainingSword(Item):
    def __init__(self) -> None:
        super().__init__(
            name="training sword",
            description="A well-balanced practice sword with a dulled blade. Though not sharp enough for real combat, it's perfect for demonstrating martial skills and training exercises.",
            can_be_carried=True,
        )

    def use(self, game_state: GameState) -> str:
        return "You practice a few sword forms with the training sword. The balance feels good in your hands, and it would be perfect for demonstrating combat skills to someone who needs proof of your abilities."
