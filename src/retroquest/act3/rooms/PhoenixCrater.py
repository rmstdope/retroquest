"""Module defining the PhoenixCrater room in Act 3."""
from ...engine.Room import Room


class PhoenixCrater(Room):
    """The Phoenix Crater: a luminous bowl of vitrified rock."""
    def __init__(self) -> None:
        super().__init__(
            name="Phoenix Crater",
            description=(
                "A luminous bowl of vitrified rock where warm drafts swirl and cinders "
                "dance in spirals."
            ),
            items=[],
            characters=[],
            exits={"north": "FumarolePassages", "west": "EmberGallery"},
        )
