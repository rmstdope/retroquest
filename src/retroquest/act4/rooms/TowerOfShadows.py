"""Tower of Shadows room: a dark spire where doubt and fear manifest."""

from ...engine.Room import Room


class TowerOfShadows(Room):
    """A twisted tower where shadows take corporeal form and doubt runs rampant.

    Narrative Role:
        Tests player's resolve against psychological attacks.

    Key Mechanics:
        Loyalty token proves bonds of trust to dispel shadow magic.

    Story Flags:
        Pathway to Chamber of Whispers, requires proof of redemption.

    Contents:
        - Items: Dispel lies spell knowledge.
        - Characters: Living shadows that whisper doubts and fears.

    Design Notes:
        Emphasizes importance of trust and friendship in overcoming darkness.
    """

    def __init__(self) -> None:
        """Initialize the Tower of Shadows with its oppressive atmosphere."""
        super().__init__(
            name="Tower of Shadows",
            description=(
                "A spiraling tower of black stone pierces the gloom, its walls seeming to "
                "absorb light itself. Tendrils of living shadow coil around the structure, "
                "reaching out with grasping fingers toward any source of warmth or hope. "
                "The air grows thicker with each step upward, and whispered doubts slither "
                "into your mind like poison. Windows reveal only deeper darkness, and the "
                "very shadows appear to mock your every movement with silent, dancing forms."
            ),
            items=[],
            characters=[],
            exits={"south": "HallOfEchoes", "up": "ChamberOfWhispers"}
        )
