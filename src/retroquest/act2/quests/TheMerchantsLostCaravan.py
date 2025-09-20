"""The Merchant's Lost Caravan Quest Module.

Rescue / investigation quest that bridges civic intrigue with wilderness
exploration and supports Sir Cedric's redemption arc.

Trigger Conditions:
- Offered after speaking to Caravan Master Thorne (``FLAG_SPOKEN_TO_CARAVAN_MASTER``).

Progression Beats (monitored via flags):
1. Learn location through forest speech interactions (sets ``FLAG_FOUND_LOST_CARAVAN``).
2. Use Quality Rope to descend ravine and free trapped merchants.
3. Completion sets ``FLAG_LOST_CARAVAN_COMPLETED`` and yields secret exonerating documents.

Narrative Impact:
- Provides evidence later consumed by Cedric's Lost Honor quest chain.
- Demonstrates synergy between item acquisition (rope) and learned utility magic.
"""

from ...engine.Quest import Quest
from ...engine.GameState import GameState
from ..Act2StoryFlags import (
    FLAG_SPOKEN_TO_CARAVAN_MASTER,
    FLAG_FOUND_LOST_CARAVAN,
    FLAG_LOST_CARAVAN_COMPLETED
)

class TheMerchantsLostCaravanQuest(Quest):
    def __init__(self) -> None:
        super().__init__(
            name="The Merchant's Lost Caravan",
            description=(
                "Caravan Master Thorne's valuable caravan has gone missing in the Enchanted "
                "Forest. Find out what happened to the merchants and their goods."
            ),
            completion=(
                "You successfully located the missing caravan trapped in a deep ravine "
                "within the Enchanted Forest. Using forest speech magic to communicate "
                "with woodland creatures, you discovered their location, then employed "
                "quality rope to rappel down and rescue the trapped merchants. All "
                "merchants survived the ordeal, and Caravan Master Thorne rewarded you "
                "with secret documents containing evidence that can clear Sir Cedric's "
                "name of false accusations from a past court case."
            ),
        )

    def check_trigger(self, game_state: GameState) -> bool:
        return game_state.get_story_flag(FLAG_SPOKEN_TO_CARAVAN_MASTER)

    def check_completion(self, game_state: GameState) -> bool:
        return game_state.get_story_flag(FLAG_LOST_CARAVAN_COMPLETED)

    def update(self, game_state: GameState) -> str:
        if game_state.get_story_flag(FLAG_FOUND_LOST_CARAVAN):
            return "You've learned the caravan's location from the woodland creatures. Now use rope to reach the ravine and rescue the trapped merchants."
        
        return "Search the Enchanted Forest for the missing caravan. Try using forest magic to communicate with woodland creatures for information."