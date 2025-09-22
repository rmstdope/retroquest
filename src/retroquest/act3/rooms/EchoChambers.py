"""Echo Chambers room for Act 3."""

from ...engine.Room import Room


class EchoChambers(Room):
    """Smooth caverns that amplify every footfall with faint whispers."""
    def __init__(self) -> None:
        """Initialize Echo Chambers with description and exits."""
        super().__init__(
            name="Echo Chambers",
            description=(
                "Smooth caverns that amplify every footfall; faint whispers mimic speech."
            ),
            items=[],
            characters=[],
            exits={"south": "DragonsHall", "west": "CollapsedGalleries"},
        )
