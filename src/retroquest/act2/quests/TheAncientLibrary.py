from ...engine.Quest import Quest
from ...engine.GameState import GameState
from ..Act2StoryFlags import (
    FLAG_ANCIENT_LIBRARY_ACCEPTED,
    FLAG_ANCIENT_LIBRARY_COMPLETED,
    FLAG_ECHOES_OF_PAST_COMPLETED
)

class TheAncientLibraryQuest(Quest):
    def __init__(self) -> None:
        super().__init__(
            name="The Ancient Library",
            description=(
                "You've discovered a hidden passage beneath Greendale containing an ancient library of magical texts and lore. "
                "You should explore its depths and uncover the secrets within."
            ),
            completion=(
                "You have successfully gained access to the ancient library's knowledge! You've learned the "
                "dispel spell, discovered important information about your family heritage, and received a "
                "Crystal Focus to enhance your magical abilities. The library's secrets have revealed "
                "crucial insights about the Chosen One prophecy and your destiny."
            )
        )

    def check_trigger(self, game_state: GameState) -> bool:
        # Quest triggers when player discovers the secret passage
        return game_state.get_story_flag(FLAG_ANCIENT_LIBRARY_ACCEPTED)

    def check_completion(self, game_state: GameState) -> bool:
        # Quest completes when player has:
        # 1. Learned the dispel spell
        # 2. Gained the Crystal Focus
        return (game_state.has_spell("dispel") and
                game_state.has_item("Crystal Focus"))