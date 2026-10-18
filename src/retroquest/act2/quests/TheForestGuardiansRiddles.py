"""The Forest Guardian's Riddles Quest Module.

Wisdom / knowledge trial emphasizing respect for natural lore and establishes
rapport with forest guardian entities.

Trigger Conditions:
- Offered upon acceptance of the guardians' intellectual challenge
    (``FLAG_FOREST_GUARDIANS_RIDDLES_OFFERED``).

Progress:
- No objectives are tracked; riddle interactions elsewhere set the completion
    flag once the guardians' riddles are solved.

Completion Logic:
- Monitors ``FLAG_FOREST_GUARDIANS_RIDDLES_COMPLETED``; on first completion
    awards experience and prints formatted quest completion string.

Design Notes:
- Provides mid‑act experience bump and thematically pairs with Whispers quest to
    represent dual aspects of forest acceptance: empathy (spirits) and intellect
    (guardians' wisdom).
"""

from ...engine.Quest import Quest
from ...engine.GameState import GameState
from ..Act2StoryFlags import (
        FLAG_FOREST_GUARDIANS_RIDDLES_OFFERED,
        FLAG_FOREST_GUARDIANS_RIDDLES_COMPLETED
)

class TheForestGuardiansRiddles(Quest):
    """Quest to solve the riddles posed by the forest guardians."""
    def __init__(self) -> None:
        super().__init__(
            name="The Forest Guardian's Riddles",
            description=(
                "The forest sprites have challenged you to prove your wisdom by solving the "
                "riddles of the forest guardians. You must journey to the Ancient Grove and "
                "beyond to the Whispering Glade, where ancient spirits will test "
                "your understanding of forest ways and natural wisdom."
            ),
            completion=(
                "You have successfully solved the riddles of the forest guardians, "
                "proving your wisdom and respect for the natural world. The "
                "forest spirits acknowledge your understanding."
            )
        )
        self.experience_reward = 200

    def check_trigger(self, game_state: GameState) -> bool:
        """Check if this quest should be activated."""
        return game_state.get_story_flag(FLAG_FOREST_GUARDIANS_RIDDLES_OFFERED)

    def check_completion(self, game_state: GameState) -> bool:
        """Check if the quest can be completed based on story flags."""
        return (
            game_state.get_story_flag(FLAG_FOREST_GUARDIANS_RIDDLES_COMPLETED)
            and not self.is_completed_flag
        )

    def complete(self, game_state: GameState) -> str:
        """Complete the quest and give rewards."""
        if not self.is_completed_flag:
            self.is_completed_flag = True

            # Add experience
            if hasattr(game_state, 'add_experience'):
                game_state.add_experience(self.experience_reward)
                exp_msg = f" You gain {self.experience_reward} experience!"
            else:
                exp_msg = ""
            return f"[success]Quest Complete: {self.name}[/success]{exp_msg}"
        return self.completion
