from ...engine.Quest import Quest
from ...engine.GameState import GameState
from ...engine.story_flags import FLAG_NOTICED_GRANDMOTHER_PHOTO, FLAG_READ_PHOTO_MESSAGE, FLAG_TALKED_TO_GRANDMOTHER_ABOUT_PHOTO

# TODO: The Faded Photograph Quest - Steps to Completion
# 1. The player finds the photograph in Elior's cottage (e.g., searching the attic or a hidden drawer).
# 2. The player observes Grandmother gazing at the photo or finds the photo, setting FLAG_NOTICED_GRANDMOTHER_PHOTO.
# 3. The photograph item is given to the player and can be examined.
# 4. The player examines/reads the back of the photograph, setting FLAG_READ_PHOTO_MESSAGE.
# 5. The photograph contains a hidden message or puzzle (required for quest completion).
# 6. The player talks to Grandmother about the photograph, triggering special dialogue.
# 7. After the dialogue, FLAG_TALKED_TO_GRANDMOTHER_ABOUT_PHOTO is set.

class FadedPhotographQuest(Quest):
    def __init__(self):
        super().__init__(
            name="The Faded Photograph",
            description=(
                "Your grandmother is often seen gazing at an old photograph. If you ask her about it, she shares a memory of your parents and gives you the photo, which has a cryptic message on the back."
            ),
            completion="You have received the photograph and discovered a cryptic message, deepening the mystery of your parents' fate."
        )

    def check_trigger(self, game_state: GameState) -> bool:
        # Triggered when the player notices the grandmother's behavior or finds the photograph
        return game_state.get_story_flag(FLAG_NOTICED_GRANDMOTHER_PHOTO)

    def check_completion(self, game_state: GameState) -> bool:
        # Completed when the player finishes the dialogue with Grandmother about the photograph
        return game_state.get_story_flag(FLAG_TALKED_TO_GRANDMOTHER_ABOUT_PHOTO)
