"""CollapsedGalleries room for the miners' rescue sequence in Act 3."""
from ...engine.Room import Room
from ...engine.GameState import GameState
from ..items.FallenRock import FallenRock
from ..characters.Miners import Miners
from ..Act3StoryFlags import FLAG_ACT3_MINERS_RESCUE_COMPLETED


class CollapsedGalleries(Room):
    """Room where miners are trapped behind a collapsed passage in Act 3."""

    def __init__(self) -> None:
        """Initialize Collapsed Galleries with rescue items, miners, and exits."""
        super().__init__(
            name="Collapsed Galleries",
            description=(
                "Passages pinched by fallen rock; dust motes hang in still air. "
                "Trapped miners wait anxiously behind the collapse."
            ),
            items=[FallenRock()],
            characters=[Miners()],
            exits={
                "south": "StillnessVestibule",
                "east": "EchoChambers",
                "west": "ToolCache"
            },
        )

    def get_exits(self, game_state: GameState) -> dict[str, str]:
        """Hide east exit until the miners' rescue is completed."""
        exits = dict(self.exits)
        if not game_state.get_story_flag(FLAG_ACT3_MINERS_RESCUE_COMPLETED):
            exits.pop("east", None)
        return exits
