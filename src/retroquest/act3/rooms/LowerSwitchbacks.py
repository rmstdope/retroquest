"""Lower Switchbacks room for Act 3."""

from ...engine.Room import Room


class LowerSwitchbacks(Room):
    """Wind-carved paths zig-zagging across black rock with canvas shelters."""
    def __init__(self) -> None:
        """Initialize Lower Switchbacks with description and exits."""
        super().__init__(
            name="Lower Switchbacks (Base Camp)",
            description=(
                "Wind‑carved paths zig‑zag across black rock; canvas shelters flap and "
                "braziers glow low."
            ),
            items=[],
            characters=[],
            exits={"north": "ObsidianOutcrops", "east": "EmberGallery"},
        )
