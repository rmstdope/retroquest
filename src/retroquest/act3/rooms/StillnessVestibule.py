from ...engine.Room import Room


class StillnessVestibule(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Stillness Vestibule",
            description=(
                "A hush falls over dark water pools; sound seems to fold into the stone."
            ),
            items=[],
            characters=[],
            exits={"north": "CollapsedGalleries", "east": "DragonsHall", "west": "CavernMouth"},
        )
