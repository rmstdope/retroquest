"""A cracked brass mirror segment used in Mirror Terraces quests."""
from ...engine.Item import Item


class BrassMirrorSegment(Item):
    """A curved brass segment for reassembling the mirror channel."""

    def __init__(self) -> None:
        """Initialize a Brass Mirror Segment item."""
        super().__init__(
            name="Brass Mirror Segment",
            description=(
                "A battered brass segment whose face still catches light. It looks "
                "fragile but usable when bound into the mirror mounts."
            ),
            short_name="mirror segment",
            can_be_carried=True,
        )
