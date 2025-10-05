"""Module defining the CavernMouth room in Act 3."""

from ...engine.Room import Room
from ..characters.MineOverseer import MineOverseer


class CavernMouth(Room):
    """The misty entrance to the ancient cavern system."""
    def __init__(self) -> None:
        """Initialize Cavern Mouth with description, Mine Overseer, and exits."""
        super().__init__(
            name="Cavern Mouth",
            description=(
                "A broad entry arch curtained by cold mist; lantern light dims at "
                "the threshold."
            ),
            items=[],
            characters=[MineOverseer()],
            exits={"north": "ToolCache", "east": "StillnessVestibule"},
        )

    def search(self, _game_state, _target: str = None) -> str:
        """Describe the misted entry and situation within."""
        return (
            "You peer into the mist. Voices echo from deeper in the tunnels—miners are trapped "
            "beyond a collapse, and the overseer stands ready to help. The Tool Cache lies north, "
            "and the Collapsed Galleries are blocked by fallen rock."
        )
