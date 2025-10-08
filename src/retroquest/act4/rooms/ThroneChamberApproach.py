"""Throne Chamber Approach room: antechamber to the final confrontation."""

from ...engine.Room import Room


class ThroneChamberApproach(Room):
    """The approach to Malakar's throne, where King Alden awaits rescue.

    Narrative Role:
        King's rescue and revelation of parent's legacy through hidden vault.

    Key Mechanics:
        Requires proving worthiness through collected redemption tokens.

    Story Flags:
        Multi-visit location: king's rescue, then parent's legacy exploration.

    Contents:
        - Items: Royal sigil, Hero's memorial, Throne key.
        - Characters: King Alden (trapped in crystal prison).

    Design Notes:
        Emotional climax before final battle, revealing family connections.
    """

    def __init__(self) -> None:
        """Initialize the Throne Chamber Approach with its regal tragedy."""
        super().__init__(
            name="Throne Chamber Approach",
            description=(
                "A magnificent antechamber leads toward the heart of the fortress, its "
                "marble floors inlaid with gold depicting the kingdom's glorious past. "
                "Heroic statues line the walls, their faces noble but mournful, as if "
                "witnessing the corruption that has befallen their realm. At the chamber's "
                "end, a crystal prison holds a regal figure whose life force slowly ebbs "
                "away, while hidden alcoves promise secrets waiting to be uncovered by "
                "those deemed worthy of the truth."
            ),
            items=[],
            characters=[],
            exits={"west": "MemoryVault", "east": "ThroneChamer", "north": "RoyalGardens"}
        )