from ...engine.Room import Room
from ...engine.GameState import GameState
from ..characters.GateCaptain import GateCaptain
from ..items.CityMap import CityMap

class GreendaleGates(Room):
    def __init__(self) -> None:
        gate_captain = GateCaptain()
        super().__init__(
            name="Greendale Gates",
            description=(
                "A magnificent stone archway marks the entrance to Greendale, the largest settlement you've encountered. "
                "Guards in polished mail stand watch, their banners fluttering in the mountain breeze. Beyond the gates, "
                "cobblestone streets wind between well-built stone houses and bustling shops. The air carries the sounds "
                "of commerce and conversation - a stark contrast to Willowbrook's quiet charm."
            ),
            items=[],
            characters=[gate_captain],
            exits={"south": "MountainPath", "north": "MainSquare"}  # Include north exit in static definition
        )
        self.gate_captain = gate_captain
        self.city_map_found = False

    def get_exits(self, game_state: GameState) -> dict:
        """Override to conditionally include north exit after entry pass is given."""
        exits = super().get_exits(game_state).copy()
        
        # Remove north exit until entry pass is given
        if not self.gate_captain.entry_pass_given and "north" in exits:
            del exits["north"]
            
        return exits

    def search(self, game_state: GameState, target: str = None) -> str:
        """Override search to handle Gate Captain presence and City Map discovery."""
        if self.gate_captain in self.characters:
            return ("The Gate Captain stands vigilant at his post, watching all who approach. "
                    "It would be improper to search around while he's observing you so closely. "
                    "Perhaps you should speak with him first.")
        
        if self.city_map_found:
            return ("You've already thoroughly searched this area. "
                    "There's nothing more to find beyond what you can already see.")
        
        self.city_map_found = True
        city_map = CityMap()
        self.add_item(city_map)
        
        return ("With the Gate Captain having stepped away, you're free to look around. "
                "You notice a small information post near the gates where visiting merchants and travelers "
                "leave helpful items. Searching through it, you discover a detailed [item_name]city map[/item_name] "
                "of Greendale - exactly what you need to navigate the city's winding streets!")
