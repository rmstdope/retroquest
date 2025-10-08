"""Memory Vault room: repository of Malakar's past and the Shadow of the Past."""

from ...engine.Room import Room


class MemoryVault(Room):
    """A temporal chamber containing fragments of Malakar's memories and past.

    Narrative Role:
        Reveals the truth about Malakar's corruption and the possibility of redemption.

    Key Mechanics:
        Requires three components to stabilize: echo stone, time crystal, sorceress's truth.

    Story Flags:
        Multi-visit location: initial assessment, then full exploration with tools.

    Contents:
        - Items: Combined mirror-memory shard, Memory fragment.
        - Characters: Shadow of the Past (Malakar's uncorrupted remnant).

    Design Notes:
        Crucial revelation point showing corruption's origin and redemption's possibility.
    """

    def __init__(self) -> None:
        """Initialize the Memory Vault with its fragmented temporal reality."""
        super().__init__(
            name="Memory Vault",
            description=(
                "This mystical chamber exists partially outside of time itself, its walls "
                "covered in floating orbs of crystallized memory that flicker with scenes "
                "from long ago. The air ripples with temporal distortions, and fragments of "
                "the past drift like spectral snow through the space. At the room's center, "
                "a shadowy figure wavers between existence and void, reaching out with "
                "desperate longing toward memories that seem to slip away like morning mist."
            ),
            items=[],
            characters=[],
            exits={"south": "ChamberOfWhispers", "east": "ThroneChamberApproach"}
        )