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
                "charcoal and iron. Streaks of glassed lava lace the walls, "
                "catching stray cinders that glow like embers in the gloom. "
                "Steam sighs from fissures and pools of blackened water mirror "
                "faint, dancing light. Worktables gather scattered fragments of "
                "fireglass and ash‑tumbled tools where attendants hammer and "
                "sort cooled slag for wards. The heat here is a steady, low "
                "thrum — a reminder that the mountain breathes beneath your "
                "feet."
            ),
            items=[],
            characters=[],
            exits={
                "north": "MirrorTerraces", 
                "west": "LowerSwitchbacks"
            },
        )
