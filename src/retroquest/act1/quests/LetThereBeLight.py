from ...engine.Quest import Quest
from ...engine.GameState import GameState

class LetThereBeLightQuest(Quest):
    def __init__(self) -> None:
        super().__init__(
            name="Let there be light",
            description="The priest has asked you to help bring light to the chapel. Perhaps this small act will illuminate more than just the room for you.",
            completion="You have brought light to the chapel, earning the gratitude of the priest and the respect of the villagers."
        )

    def check_trigger(self, game_state: GameState) -> bool:
        return game_state.get_story_flag("priest_talked_to")

    def check_completion(self, game_state: GameState) -> bool:
        candle = game_state.get_item("candle")
        return bool(candle and candle.is_lit)
