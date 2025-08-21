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
                "You've discovered a hidden library beneath Greendale containing ancient magical texts and lore. "
                "The protective enchantments need to be repaired with the mend spell before you can access the "
                "most valuable knowledge. Prove your worthiness to the Spectral Librarian and unlock the "
                "mysteries of your heritage."
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
        # 2. Gained knowledge about their heritage (which completes Echoes of the Past)
        # 3. Obtained the Crystal Focus
        return (game_state.get_story_flag(FLAG_ANCIENT_LIBRARY_COMPLETED) and
                game_state.has_spell("dispel") and
                game_state.get_story_flag(FLAG_ECHOES_OF_PAST_COMPLETED) and
                game_state.has_item("Crystal Focus"))