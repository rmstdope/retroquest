"""Fumarole Passages room for Act 3."""

from ...engine.Room import Room


class FumarolePassages(Room):
    """Narrow tunnels exhaling rhythmic heat like a great sleeping bellows."""
    def __init__(self) -> None:
        """Initialize Fumarole Passages with description and exits."""
        super().__init__(
            name="Fumarole Passages",
            description=(
                "Narrow tunnels exhaling rhythmic heat; stone vents chuff like a great "
                "sleeping bellows."
            ),
            items=[],
            characters=[],
            exits={"south": "PhoenixCrater", "west": "MirrorTerraces"},
        )
