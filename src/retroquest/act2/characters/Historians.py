"""Historians (Act II)

Role:
    Scholarly review collective validating genealogical and regional lore artifacts. Bridges
    raw discovery (player reads TravelersJournal) with authoritative confirmation, lending
    narrative weight to heritage revelations.

Flow:
    - Player must read TravelersJournal first (FLAG_READ_TRAVELERS_JOURNAL) before presenting it;
      otherwise receives cautionary failure advising self-understanding.
    - Successful presentation sets FLAG_SHOWED_JOURNAL_TO_HISTORIANS delivering affirmation dialogue.

Story Flags:
    - Reads: FLAG_READ_TRAVELERS_JOURNAL, FLAG_SHOWED_JOURNAL_TO_HISTORIANS
    - Sets: FLAG_SHOWED_JOURNAL_TO_HISTORIANS

Design Notes:
    - Ensures lore is not passively forwarded—player must internalize content (read flag) first.
    - Prevents duplicate state spam by idempotent early return once flag set.
    - Future extension: Could unlock deeper archive tiers or cross-reference other relics if additional
      genealogical artifacts introduced.
"""

from ...engine.Character import Character
from ...engine.GameState import GameState
from ...engine.Item import Item
from ..Act2StoryFlags import FLAG_SHOWED_JOURNAL_TO_HISTORIANS, FLAG_READ_TRAVELERS_JOURNAL

class Historians(Character):
    def __init__(self) -> None:
        super().__init__(
            name="historians",
            description="A group of learned scholars who maintain the court's historical records and genealogical archives. They are eager to examine any historical documents or artifacts.",
        )

    def talk_to(self, game_state: GameState) -> str:
        if game_state.get_story_flag(FLAG_SHOWED_JOURNAL_TO_HISTORIANS):
            return (f"[character_name]{self.get_name()}[/character_name]: The journal you showed us was most illuminating! "
                    "The references to Willowbrook's bloodlines confirm what we suspected from the ancient chronicles. "
                    "Your heritage appears to be quite significant indeed.")
        else:
            return (f"[character_name]{self.get_name()}[/character_name]: Welcome to the historical archives. We maintain "
                    "records of regional history, family genealogies, and ancient chronicles. Do you have any "
                    "historical documents or artifacts you'd like us to examine?")

    def give_item(self, game_state: GameState, item_object: Item) -> str:
        """Handle giving items to the Historians"""
        from ..items.TravelersJournal import TravelersJournal
        
        if isinstance(item_object, TravelersJournal):
            if not game_state.get_story_flag(FLAG_READ_TRAVELERS_JOURNAL):
                return ("[failure]You should not give things away that you know nothing about. Perhaps you should "
                        "ensure that you understand its contents before sharing it with others.[/failure]")

            game_state.set_story_flag(FLAG_SHOWED_JOURNAL_TO_HISTORIANS, True)
            return (f"[success]You show the [item_name]{item_object.get_name()}[/item_name] to the [character_name]{self.name}[/character_name]. "
                    f"They examine it with great interest, cross-referencing the genealogical information with their "
                    f"own records. 'This is fascinating! The journal confirms several theories about Willowbrook's "
                    f"significance and provides crucial context for the ancient chronicles.'[/success]")
        else:
            return super().give_item(game_state, item_object)