"""Hint of Magic quest for Act 1: unlocks leaving the cottage after the dream."""
from ...engine.Quest import Quest
from ...engine.GameState import GameState

class HintOfMagicQuest(Quest):
    """Quest that unlocks the cottage exits after the player learns the revive spell."""
    def __init__(self) -> None:
        super().__init__(
            name="Hint of Magic",
            description=(
                "After a strange, vivid dream, you awaken with the sense that something beyond "
                "the ordinary is calling to you. A mysterious force stirs within, urging you to "
                "pay attention to the signs around you and discover what this new feeling means."
            ),
            completion=(
                "You have discovered that the strange feeling within you is the first sign of "
                "something magical. Your journey into the unknown has truly begun."
            )
        )

    def check_trigger(self, _game_state: GameState) -> bool:
        # Triggered when the player talks to Grandmother for the first time
        return True

    def check_completion(self, game_state: GameState) -> bool:
        # Completed when the player has learned the 'revive' spell.
        # Exits in EliorsCottage are unlocked dynamically via get_exits() once the
        # spell is known, so no explicit can_leave() call is needed here.
        return game_state.has_spell('revive')
