"""Fortress Gates room: the imposing entrance to Malakar's shadow fortress."""

from ...engine.Room import Room


class FortressGates(Room):
    """The dark entrance to Malakar's fortress, protected by shadow guardians.

    Narrative Role:
        First breach point requiring courage and light magic to overcome defenses.

    Key Mechanics:
        Ward stones must be examined and fragments used to disable barriers.

    Story Flags:
        Required for entering the fortress complex.

    Contents:
        - Items: Ward stone fragments, Guardian's essence, Guardian's chain.
        - Characters: Shadow guardians (defeated through light magic).

    Design Notes:
        Sets the tone for the entire fortress with immediate magical challenges.
    """

    def __init__(self) -> None:
        """Initialize the Fortress Gates with its ominous atmosphere and barriers."""
        super().__init__(
            name="Fortress Gates",
            description=(
                "Towering obsidian gates loom before you, carved with writhing shadows that "
                "seem to move in the corners of your vision. Ancient ward stones pulse with "
                "malevolent energy, casting eerie purple light across the threshold. The air "
                "crackles with dark magic, and whispers of forgotten souls echo from beyond "
                "the barrier. Spectral guardians drift between the stones, their hollow eyes "
                "fixed upon any who dare approach this cursed entrance."
            ),
            items=[],
            characters=[],
            exits={"north": "HallOfEchoes", "east": "OuterCourtyard"}
        )
