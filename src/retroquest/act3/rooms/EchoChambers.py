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
                "Smooth caverns carved from living stone stretch into shadow, where "
                "every footfall reverberates through the darkness like whispered "
                "incantations. Faint, otherworldly voices seem to mimic your speech, "
                "echoing from unseen alcoves as if ancient spirits dwell within the "
                "walls themselves. Mysterious runic walls line the chamber, their "
                "symbols glowing with a dim, ethereal light that pulses in rhythm "
                "with your heartbeat. The air thrums with an almost palpable energy, "
                "and you sense that this place has witnessed rituals of great power."
            ),
            items=[RunicWalls()],
            exits={
                "west": "CollapsedGalleries"
            },
        )
