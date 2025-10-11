"""Royal Gardens room: peaceful resolution space for the ending choice."""

from ...engine.Room import Room


class RoyalGardens(Room):
    """A restored sanctuary where the final choice about Malakar's fate is made.

    Narrative Role:
        Epilogue space for determining the kingdom's future through player choice.

    Key Mechanics:
        Final decision point between redemption and justice approaches.

    Story Flags:
        Determines ending based on accumulated redemption vs punishment choices.

    Contents:
        - Items: None (story resolution focus).
        - Characters: Potential redeemed characters based on player choices.

    Design Notes:
        Peaceful conclusion emphasizing player agency in shaping the world.
    """

    def __init__(self) -> None:
        """Initialize the Royal Gardens with their restored beauty."""
        super().__init__(
            name="Royal Gardens",
            description=(
                "Sunlight filters through ancient oaks whose leaves whisper with renewed "
                "life, while crystal-clear streams meander between beds of blooming flowers "
                "that seem to glow with inner light. The corruption has been cleansed from "
                "this sacred space, revealing its true beauty—a garden where hope grows "
                "eternal and second chances blossom like spring after the longest winter. "
                "Stone benches invite quiet contemplation, and the very air hums with the "
                "promise of new beginnings and the weight of momentous decisions."
            ),
            items=[],
            characters=[],
            exits={"south": "ThroneChamberApproach"}
        )
