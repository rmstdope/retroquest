"""Ember Gallery room for Act 3."""

from ...engine.Room import Room


class EmberGallery(Room):
    """A vaulted cavern veined with cooling flows smelling of charcoal and iron."""
    def __init__(self) -> None:
        """Initialize Ember Gallery with description and exits."""
        super().__init__(
            name="Ember Gallery",
            description=(
                "A vaulted cavern veined with cooling flows; the air smells of "
                "charcoal and iron."
            ),
            items=[],
            characters=[],
            exits={
                "north": "MirrorTerraces", 
                "east": "PhoenixCrater", 
                "west": "LowerSwitchbacks"
            },
        )
