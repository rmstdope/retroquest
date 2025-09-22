"""Dragon's Hall room for Act 3."""

from ...engine.Room import Room


class DragonsHall(Room):
    """A vast chamber lit by slow-breathing embers beneath scaled coils."""
    def __init__(self) -> None:
        """Initialize Dragon's Hall with description and exits."""
        super().__init__(
            name="Dragon's Hall",
            description=(
                "A vast chamber lit by slow‑breathing embers beneath scaled coils; "
                "age‑old sigils line the floor."
            ),
            items=[],
            characters=[],
            exits={"north": "EchoChambers", "west": "StillnessVestibule"},
        )
