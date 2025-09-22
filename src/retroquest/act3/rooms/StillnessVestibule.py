"""Stillness Vestibule room for Act 3."""

from ...engine.Room import Room


class StillnessVestibule(Room):
    """A quiet chamber where hush falls over dark water pools."""
    def __init__(self) -> None:
        """Initialize Stillness Vestibule with description and exits."""
        super().__init__(
            name="Stillness Vestibule",
            description=(
                "A hush falls over dark water pools; sound seems to fold into the stone."
            ),
            items=[],
            characters=[],
            exits={
                "north": "CollapsedGalleries", 
                "east": "DragonsHall", 
                "west": "CavernMouth"
            },
        )
