"""Chamber of Whispers room: domain of the Sorceress of Lies."""

from ...engine.Room import Room


class ChamberOfWhispers(Room):
    """The sorceress's domain where truth becomes malleable and lies feel real.

    Narrative Role:
        Confrontation with the Sorceress of Lies, testing empathy and understanding.

    Key Mechanics:
        Heart's truth magic reveals pain beneath deception.

    Story Flags:
        Provides time crystal and sorceress's truth needed for Memory Vault.

    Contents:
        - Items: Sorceress's truth, Time crystal.
        - Characters: Sorceress of Lies (redeemable through compassion).

    Design Notes:
        Another redemption scenario showing mercy's power over vengeance.
    """

    def __init__(self) -> None:
        """Initialize the Chamber of Whispers with its deceptive beauty."""
        super().__init__(
            name="Chamber of Whispers",
            description=(
                "This circular chamber pulses with an otherworldly beauty that feels wrong, "
                "as if reality itself has been twisted into a more pleasing shape. Crystalline "
                "formations jut from the walls, each one humming with barely audible whispers "
                "that speak of your deepest desires and fears. The floor shifts beneath your "
                "feet like liquid glass, and the air shimmers with illusions that promise "
                "everything you've ever wanted while hiding terrible truths in their depths."
            ),
            items=[],
            characters=[],
            exits={"down": "TowerOfShadows", "north": "MemoryVault"}
        )