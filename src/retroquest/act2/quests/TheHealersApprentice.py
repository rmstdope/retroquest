from ...engine.Quest import Quest
from ...engine.GameState import GameState
from ..Act2StoryFlags import (
    FLAG_HEALERS_APPRENTICE_ACCEPTED,
    FLAG_HEALERS_APPRENTICE_COMPLETED,
    FLAG_LYRIA_RELATIONSHIP_STUDENT
)

class TheHealersApprenticeQuest(Quest):
    def __init__(self) -> None:
        super().__init__(
            name="The Healer's Apprentice",
            description=(
                "Master Healer Lyria has recognized your magical potential and offered to teach you advanced "
                "healing techniques. She requires you to bring Healing Herbs as proof of your commitment to "
                "the healing arts. Learn from her wisdom and master the greater_heal spell."
            ),
            completion=(
                "You have successfully completed your apprenticeship with Master Healer Lyria! You've learned "
                "the greater_heal spell and received an Advanced Healing Potion for emergencies. Your "
                "understanding of healing magic has grown significantly."
            )
        )

    def check_trigger(self, game_state: GameState) -> bool:
        # Quest triggers when player talks to Lyria with Healing Herbs
        return game_state.get_story_flag(FLAG_HEALERS_APPRENTICE_ACCEPTED)

    def check_completion(self, game_state: GameState) -> bool:
        # Quest completes when player has learned greater_heal spell and received training
        return (game_state.get_story_flag(FLAG_HEALERS_APPRENTICE_COMPLETED) and
                game_state.has_spell("greater_heal") and
                game_state.get_story_flag(FLAG_LYRIA_RELATIONSHIP_STUDENT))