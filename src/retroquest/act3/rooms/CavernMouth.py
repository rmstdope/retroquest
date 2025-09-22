"""Module defining the CavernMouth room in Act 3."""
from ...engine.Room import Room


class CavernMouth(Room):
    """The misty entrance to the ancient cavern system."""
    def __init__(self) -> None:
        """Initialize Cavern Mouth with description and exits."""
        super().__init__(
            name="Cavern Mouth",
            description=(
                "A broad entry arch curtained by cold mist; lantern light dims at "
                "the threshold."
            ),
            items=[],
            characters=[],
            exits={"north": "ToolCache", "east": "StillnessVestibule"},
        )
