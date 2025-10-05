"""Dragon's Hall room for Act 3."""

from ...engine.Room import Room
from ..items.OldOathScrolls import OldOathScrolls
from ..characters.AncientDragon import AncientDragon


class DragonsHall(Room):
    """A vast chamber lit by slow-breathing embers beneath scaled coils."""
    
    def __init__(self) -> None:
        """Initialize Dragon's Hall with description and exits."""
        super().__init__(
            name="Dragon's Hall",
            description=(
                "A vast chamber lit by slow‑breathing embers beneath scaled coils; "
                "age‑old sigils line the floor. The ancient dragon rests at the "
                "chamber's heart, scales gleaming like polished obsidian."
            ),
            items=[
                OldOathScrolls()
                # DragonsScale is added dynamically via AncientDragon.say_to() after oath
            ],
            characters=[AncientDragon()],
            exits={
                "north": "EchoChambers",
                "west": "StillnessVestibule"
            },
        )
