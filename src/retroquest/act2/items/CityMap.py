from ...engine.Item import Item
from ...engine.GameState import GameState

class CityMap(Item):
    def __init__(self) -> None:
        super().__init__(
            name="City Map",
            description="A detailed map of Greendale showing the main districts, important buildings, and street layouts. The map is well-drawn and clearly marked, making navigation through the city much easier.",
            can_be_carried=True,
        )

    def use(self, game_state: GameState) -> str:
        # Set the story flag when the city map is used
        game_state.set_story_flag("used_city_map", True)
        return ("You study the city map carefully. The detailed layout shows the Main Square at the center, "
                "with the Market District to the east, Castle Approach to the north, and various other important "
                "locations clearly marked. With this map, you can navigate Greendale's streets without getting lost.")

    def examine(self, game_state: GameState) -> str:
        return ("You examine the city map closely. It's a professional cartographer's work, showing detailed "
                "street layouts, building locations, and district boundaries. The map covers all of Greendale's "
                "major areas and would be invaluable for navigation.")
