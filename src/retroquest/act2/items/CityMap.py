"""City Map (Act II Item)

Narrative Role:
    Transitional knowledge artifact helping the player internalize Greendale's spatial layout. Serves as a
    one-time navigation unlock that declutters inventory after memorization.

Key Mechanics / Interactions:
    - use() sets FLAG_USED_CITY_MAP then invokes MainSquare.enable_city_navigation() (dynamic exit expansion or
      related affordances) if the room implements the hook.
    - Item is removed from inventory post-use to represent committed memory (non-repeatable effect).
    - examine() provides persistent descriptive context while still possessed.

Story Flags:
    - Sets: FLAG_USED_CITY_MAP
    - Reads: (none)

Progression Effects:
    Unlocks richer traversal of Greendale from its hub without requiring repeated item usage.

Design Notes:
    - Delegates structural mutation to room method, preserving SRP and avoiding map logic coupling here.
    - Removal prevents redundant flag setting and emphasizes permanent acquisition of knowledge.
"""

from ...engine.Item import Item
from ...engine.GameState import GameState
from ..Act2StoryFlags import FLAG_USED_CITY_MAP

class CityMap(Item):
    def __init__(self) -> None:
        super().__init__(
            name="city map",
            short_name="map",
            description="A detailed map of Greendale showing the main districts, important buildings, and street layouts. The map is well-drawn and clearly marked, making navigation through the city much easier.",
            can_be_carried=True,
        )

    def use(self, game_state: GameState) -> str:
        # Set the story flag when the city map is used
        game_state.set_story_flag(FLAG_USED_CITY_MAP, True)
        # Enable city navigation in Main Square
        main_square = game_state.all_rooms.get("MainSquare")
        if main_square and hasattr(main_square, 'enable_city_navigation'):
            main_square.enable_city_navigation()
        # Remove the map from inventory since it's been memorized
        game_state.remove_item_from_inventory("city map")
        return ("You study the city map carefully. The detailed layout shows the Main Square at the center, "
                "with the Market District to the east, Castle Approach to the north, and various other important "
                "locations clearly marked. You commit the layout to memory and no longer need to carry the physical map.")

    def examine(self, _game_state: GameState) -> str:
        return ("You examine the city map closely. It's a professional cartographer's work, showing detailed "
                "street layouts, building locations, and district boundaries. The map covers all of Greendale's "
                "major areas and would be invaluable for navigation.")
