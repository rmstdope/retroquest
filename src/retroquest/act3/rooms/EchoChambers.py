"""EchoChambers room for the resonant chant sequence in Act 3."""
from ...engine.Room import Room
from ..items.RunicWalls import RunicWalls


class EchoChambers(Room):
    """Echoing caverns with runic walls and chant rubbings."""

    def __init__(self) -> None:
        """Initialize Echo Chambers with runic walls and exits."""
        super().__init__(
            name="Echo Chambers",
            description=(
                "Smooth caverns that amplify every footfall; faint whispers "
                "mimic speech. Runic walls line the chamber."
            ),
            items=[RunicWalls()],
            exits={
                "south": "DragonsHall",
                "west": "CollapsedGalleries"
            },
        )
