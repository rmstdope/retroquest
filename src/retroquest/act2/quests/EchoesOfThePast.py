"""Echoes of the Past Quest Module.

Focused lore discovery quest exploring protagonist heritage and regional history.

Trigger Conditions:
- Begins after reading the traveler's journal (``FLAG_READ_TRAVELERS_JOURNAL``).

Objective:
- Conduct archival / hall research culminating in setting
    ``FLAG_RESEARCHED_FAMILY_HERITAGE``.

Completion Logic:
- Quest completes once heritage research flag is set, unlocking lineage
    exposition valuable to the Act II main narrative thread.
"""

from ...engine.Quest import Quest
from ...engine.GameState import GameState
from ..Act2StoryFlags import FLAG_RESEARCHED_FAMILY_HERITAGE, FLAG_READ_TRAVELERS_JOURNAL

class EchoesOfThePastQuest(Quest):
    def __init__(self) -> None:
        super().__init__(
            name="Echoes of the Past",
            description="Investigate your family heritage and Willowbrook's significance by researching historical records and genealogical information in the Great Hall.",
            completion="You have uncovered important information about your family heritage and Willowbrook's significance in ancient history!"
        )

    def check_trigger(self, game_state: GameState) -> bool:
        return game_state.get_story_flag(FLAG_READ_TRAVELERS_JOURNAL)

    def check_completion(self, game_state: GameState) -> bool:
        return game_state.get_story_flag(FLAG_RESEARCHED_FAMILY_HERITAGE)
