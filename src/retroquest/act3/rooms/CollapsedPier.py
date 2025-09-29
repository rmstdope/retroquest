"""Module defining the CollapsedPier room in Act 3."""
from ...engine.Room import Room
from ..items import Locker

class CollapsedPier(Room):
    """A shattered jetty with sunken vaults beneath; barnacled beams jut like ribs."""
    def __init__(self) -> None:
        """Initialize Collapsed Pier with locker and exits."""
        super().__init__(
            name="Collapsed Pier",
            description=(
                "A shattered jetty with sunken vaults beneath; barnacled beams jut "
                "like ribs."
            ),
            items=[Locker()],
            characters=[],
            exits={"west": "OuterWards"},
        )
