"""Throne Chamber room: the final confrontation with Malakar."""

from ...engine.Room import Room


class ThroneChamer(Room):
    """The seat of corrupted power where Malakar awaits final judgment.

    Narrative Role:
        Ultimate confrontation where all previous choices determine the outcome.

    Key Mechanics:
        Final battle using all acquired knowledge, spells, and redemption items.

    Story Flags:
        Climactic battle requiring wisdom over strength.

    Contents:
        - Items: None (all previous items culminate here).
        - Characters: Malakar (final boss, potentially redeemable).

    Design Notes:
        Resolution of all character development and redemption themes.
    """

    def __init__(self) -> None:
        """Initialize the Throne Chamber with its dark majesty."""
        super().__init__(
            name="Throne Chamber",
            description=(
                "The corrupted heart of the kingdom spreads before you—a throne room "
                "twisted by shadow magic into a monument of despair. The obsidian throne "
                "pulses with malevolent energy, surrounded by floating crystals that hum "
                "with captured screams. Dark tapestries depicting scenes of conquest and "
                "suffering drape the walls, while the very air crackles with the weight "
                "of accumulated power and pain. Here, where light once brought hope, only "
                "darkness remains—waiting for someone brave enough to challenge its dominion."
            ),
            items=[],
            characters=[],
            exits={"west": "ThroneChamberApproach"}
        )