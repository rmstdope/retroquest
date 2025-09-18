from ...engine.Room import Room


class DragonsHall(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Dragon's Hall",
            description=(
                "A vast chamber lit by slow‑breathing embers beneath scaled coils; age‑old sigils line the floor."
            ),
            items=[],
            characters=[],
            exits={"north": "EchoChambers", "west": "StillnessVestibule"},
        )
