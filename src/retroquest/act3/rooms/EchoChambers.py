from ...engine.Room import Room


class EchoChambers(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Echo Chambers",
            description=(
                "Smooth caverns that amplify every footfall; faint whispers mimic speech."
            ),
            items=[],
            characters=[],
            exits={"south": "DragonsHall", "west": "CollapsedGalleries"},
        )
