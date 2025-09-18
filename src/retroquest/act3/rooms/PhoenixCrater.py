from ...engine.Room import Room


class PhoenixCrater(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Phoenix Crater",
            description=(
                "A luminous bowl of vitrified rock where warm drafts swirl and cinders dance in spirals."
            ),
            items=[],
            characters=[],
            exits={"north": "FumarolePassages", "west": "EmberGallery"},
        )
