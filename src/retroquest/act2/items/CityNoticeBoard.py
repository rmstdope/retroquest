"""City Notice Board (Act II Environmental/Economy Item)

Narrative Role:
    Public information hub conveying civic atmosphere and seeding quest hook for 'The Gathering Storm'.

Key Mechanics / Interactions:
    - Non-carriable static item; examine() reveals postings with emphasis on key recruitment notice.
    - Currently read-only—no flag mutation here (quest acceptance handled via separate NPC/flow).

Story Flags:
    - Sets/Reads: (none) — intentionally passive to avoid redundant gating.

Progression Effects:
    Atmospherically foreshadows main conflict escalation, orienting player toward knightly authority structures.

Design Notes:
    - Could later set a discovery flag (e.g., FLAG_READ_GATHERING_STORM_NOTICE) if tracking exploration completeness is desired.
"""

from ...engine.GameState import GameState
from ...engine.Item import Item

class CityNoticeBoard(Item):
    def __init__(self) -> None:
        super().__init__(
            name="city notice board",
            short_name="board",
            description="A large wooden board posted with official notices, job postings, and announcements. The most prominent posting seeks brave souls for 'The Gathering Storm' - a call for heroes to help defend against rising dark forces.",
            can_be_carried=False,
        )

    def examine(self, _game_state: GameState) -> str:
        return ("You read through the various postings on the notice board. Most are mundane announcements about "
                "trade regulations and festival dates, but one catches your eye: a formal call for heroes to aid "
                "in 'The Gathering Storm.' The notice bears the seal of Sir Cedric and promises great rewards for "
                "those brave enough to answer the call.")