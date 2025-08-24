from ...engine.Room import Room
from ...engine.GameState import GameState
from ..characters.LocalCraftsmen import LocalCraftsmen
from ..characters.Families import Families
from ..items.HealingHerbs import HealingHerbs
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
            return ("[success]You search through the basement areas of the residential buildings. Behind some old "
                    "storage crates and forgotten furniture, you discover a concealed entrance hidden in the stone "
                    "wall. A narrow tunnel leads deeper underground to what appears to be an ancient chamber. "
                    "You've found a secret passage to a [location_name]Hidden Library[/location_name]! You can now "
                    "use 'go secret_passage' to enter this mysterious underground repository.[/success]")
        else:
            return "[info]You've already discovered the secret passage to the Hidden Library.[/info]"
