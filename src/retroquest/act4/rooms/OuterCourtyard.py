"""Outer Courtyard room: corrupted servants trapped in eternal servitude."""

from ...engine.Room import Room


class OuterCourtyard(Room):
    """A once-beautiful courtyard now tainted by shadow magic and trapped souls.

    Narrative Role:
        Introduces themes of compassion through freeing enslaved servants.

    Key Mechanics:
        Guardian's essence and blessing magic required to break servant chains.

    Story Flags:
        Provides loyalty token and pendant needed for later navigation.

    Contents:
        - Items: Loyalty token, Servant's pendant.
        - Characters: Trapped servants (freed through acts of mercy).

    Design Notes:
        Emphasizes redemption theme that will be crucial for Malakar encounter.
    """

    def __init__(self) -> None:
        """Initialize the Outer Courtyard with its tragic beauty and suffering."""
        super().__init__(
            name="Outer Courtyard",
            description=(
                "What was once a magnificent courtyard now writhes under a shroud of despair. "
                "Withered fountains weep black tears, and twisted statues reach toward a sky "
                "that seems perpetually stormy. Ethereal figures wander in endless circles, "
                "their faces etched with torment as dark chains bind their spirits to this "
                "cursed ground. The very stones beneath your feet pulse with anguish, and "
                "the air tastes of lost hope and forgotten dreams."
            ),
            items=[],
            characters=[],
            exits={"west": "FortressGates", "north": "MirrorLabyrinth"}
        )