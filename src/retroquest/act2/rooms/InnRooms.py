"""Inn Rooms (Act II)

Narrative Role:
    Private upstairs area of Silver Stag Inn providing loot discovery (hidden journal) and coin resources.

Key Mechanics:
    - search() injects TravelersJournal on first use (journal_found flag prevents duplication).
    - Pre-populated with list comprehension generated Coins (aggregate wealth source, plural item counts displayed in Room.describe()).

Story Flags:
    - None currently; discovery tracked via local boolean only.

Contents:
    - Items: Multiple Coins (economy support), conditional TravelersJournal (lore/progression catalyst).
    - Characters: None to maintain solitary atmosphere.

Design Notes:
    - Hidden item pattern mirrors CastleCourtyard approach; consistent idempotent search design.
    - If rest mechanics expanded, this location could grant enhanced recovery bonuses.
"""

from ...engine.Room import Room
from ...engine.GameState import GameState
from ..items.TravelersJournal import TravelersJournal
from ..items.Coins import Coins

class InnRooms(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Inn Rooms",
            description=(
                "Comfortable guest rooms on the upper floor of The Silver Stag Inn. Each room has a cozy bed, a writing desk, "
                "and a window overlooking the Market District. The rooms are clean and well-maintained, providing a peaceful "
                "retreat for travelers. From here, you can hear the gentle murmur of conversation from the common room below."
            ),
            items=[Coins() for _ in range(20)],
            characters=[],
            exits={"west": "SilverStagInn"}
        )
        self.journal_found = False

    def search(self, game_state: GameState, target: str = None) -> str:
        """Search the inn rooms to find hidden items"""
        if not self.journal_found:
            # Add the journal to the room when first searched
            journal = TravelersJournal()
            self.add_item(journal)
            self.journal_found = True
            return ("[event]You search the inn rooms thoroughly.[/event]\n\n"
                    "As you examine the room carefully, you notice that one of the wooden floorboards near the bed seems "
                    "slightly raised. When you press on it, the board shifts with a soft creak. Prying it up reveals a "
                    "hidden space beneath where you discover a leather-bound journal that appears to have been deliberately "
                    "concealed by a previous guest. The journal contains detailed notes and observations that might prove useful for your journey.")
        else:
            return ("[event]You search the inn rooms again.[/event]\n\n"
                    "You've already thoroughly searched this room and found everything of interest.")
