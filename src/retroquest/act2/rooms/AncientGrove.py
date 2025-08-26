from typing import Union, Any
from ...engine.Room import Room
from ..characters.AncientTreeSpirit import AncientTreeSpirit
from ..items.SilverTree import SilverTree
from ..Act2StoryFlags import FLAG_WHISPERS_IN_WIND_COMPLETED

class AncientGrove(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Ancient Grove",
            description=(
                "A circular clearing dominated by trees so old and massive they seem to touch the sky. Their bark bears "
                "carved symbols that predate human memory, and the air shimmers with concentrated magic. At the center "
                "grows a tree unlike any other - its silver bark gleams and its leaves whisper secrets in an ancient "
                "tongue. This is clearly a place of power and the sacred gateway to the forest's deepest mysteries. "
            ),
            items=[SilverTree()],
            characters=[],
            exits={"north": "ForestEntrance", "south": "HeartOfTheForest"}
        )

    def get_exits(self, game_state: Union[Any, None] = None) -> dict[str, str]:
        """Override get_exits to conditionally show the south exit."""
        base_exits = {"north": "ForestEntrance"}
        
        # Only show south exit if the Whispers in the Wind quest is completed
        if game_state and game_state.get_story_flag(FLAG_WHISPERS_IN_WIND_COMPLETED):
            base_exits["south"] = "HeartOfTheForest"
            
        return base_exits
