"""ResonantChantRubbings item for the Echo Chambers."""
from ...engine.Item import Item


class ResonantChantRubbings(Item):
    """Rubbings of the Resonant Chant from the Echo Chambers."""

    def __init__(self) -> None:
        """Initialize Resonant Chant Rubbings."""
        super().__init__(
            name="Resonant Chant Rubbings",
            description=(
                "Carefully made rubbings of ancient runes containing the "
                "Resonant Chant: 'Let stillness echo, let silence bind.'"
            ),
            can_be_carried=True
        )
