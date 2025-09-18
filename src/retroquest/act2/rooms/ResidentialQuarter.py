"""Residential Quarter (Act II)

Narrative Role:
    Civic hub representing Greendale's productive middle class. Serves as discovery vector
    for the Hidden Library via active searching, rewarding curiosity outside primary quest hubs.

Key Mechanics:
    - First successful search() without prior discovery sets FLAG_ANCIENT_LIBRARY_ACCEPTED and
      injects a new exit 'secret_passage' leading to HiddenLibrary.
    - Subsequent searches provide idempotent informational messaging.

Story Flags:
    - Sets: FLAG_ANCIENT_LIBRARY_ACCEPTED (library access unlocked)
    - Reads: same flag to prevent duplicate unlocking.

NPC Composition:
    - LocalCraftsmen (gateway to Mend spell) and Families (healing herbs reward after civic aid), reinforcing community theme.

Design Notes:
    - Discovery uses search rather than passive presence to encourage exploration.
    - Secret exit added in-place keeping minimal coupling; if more hidden exits appear, consider a HiddenExitManager.
"""

from ...engine.Room import Room
from ...engine.GameState import GameState
from ..characters.LocalCraftsmen import LocalCraftsmen
from ..characters.Families import Families
from ..Act2StoryFlags import (
    FLAG_ANCIENT_LIBRARY_ACCEPTED
)

class ResidentialQuarter(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Residential Quarter",
            description=(
                "Quiet streets lined with comfortable two-story homes, each with small gardens and workshops. Smoke rises "
                "from chimneys, and the sound of craftsmen at work echoes from various buildings. This is where Greendale's "
                "skilled artisans and middle-class citizens live and work. The atmosphere is peaceful and industrious."
            ),
            items=[],
            characters=[LocalCraftsmen(), Families()],
            exits={"south": "CastleCourtyard", "north": "HealersHouse"}
        )

    def search(self, game_state: GameState, target: str = None) -> str:
        """Handle searching for the Hidden Library entrance"""
        if not game_state.get_story_flag(FLAG_ANCIENT_LIBRARY_ACCEPTED):
            game_state.set_story_flag(FLAG_ANCIENT_LIBRARY_ACCEPTED, True)
            # Add the secret passage exit when the library is discovered
            self.exits["secret_passage"] = "HiddenLibrary"
            
            # Get the Hidden Library room name for the message
            from ..rooms.HiddenLibrary import HiddenLibrary
            hidden_library = HiddenLibrary()
            
            return (f"[success]You search through the basement areas of the residential buildings. Behind some old "
                    f"storage crates and forgotten furniture, you discover a concealed entrance hidden in the stone "
                    f"wall. A narrow tunnel leads deeper underground to what appears to be an ancient chamber. "
                    f"You've found a secret passage to a [location_name]{hidden_library.name}[/location_name]! You can now "
                    f"use 'go secret_passage' to enter this mysterious underground repository.[/success]")
        else:
            # Get the Hidden Library room name for the message  
            from ..rooms.HiddenLibrary import HiddenLibrary
            hidden_library = HiddenLibrary()
            return f"[info]You've already discovered the secret passage to the {hidden_library.name}.[/info]"
