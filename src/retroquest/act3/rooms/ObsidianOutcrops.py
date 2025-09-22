"""Module defining the ObsidianOutcrops room in Act 3."""
from ...engine.Room import Room


class ObsidianOutcrops(Room):
    """The Obsidian Outcrops: sharp volcanic glass formations."""
    def __init__(self) -> None:
        """Initialize Obsidian Outcrops with description and exits."""
        super().__init__(
            name="Obsidian Outcrops",
            description=(
                "Needle‑sharp obsidian towers; mirror fragments glint from crevices."
            ),
            items=[],
            characters=[],
            exits={"south": "LowerSwitchbacks", "east": "MirrorTerraces"},
        )
