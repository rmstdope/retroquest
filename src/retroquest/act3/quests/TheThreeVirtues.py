from ...engine.Quest import Quest
from ...engine.GameState import GameState
from ..Act3StoryFlags import FLAG_ACT3_MAIN_STARTED, FLAG_ACT3_MAIN_COMPLETED


class TheThreeVirtuesQuest(Quest):
    def __init__(self) -> None:
        super().__init__(
            name="The Three Virtues",
            description=(
                "Prove Courage, Wisdom, and Selflessness by recovering the three relics: the Crystal of Light, "
                "the Phoenix Feather, and the Dragon's Scale."
            ),
        )
        self._flag_state = {}

    def is_main(self) -> bool:
        return True

    def check_trigger(self, game_state: GameState) -> bool:
        # Trigger when Mira has started the main plan in Act III
        return game_state.get_story_flag(FLAG_ACT3_MAIN_STARTED)

    def check_update(self, game_state: GameState) -> bool:
        # Could evolve with relic progress; keep static for step 1/2 scope
        return False

    def check_completion(self, game_state: GameState) -> bool:
        # Completes when Act 3 main completed flag set elsewhere (e.g., after Warding Rite)
        return game_state.get_story_flag(FLAG_ACT3_MAIN_COMPLETED)
