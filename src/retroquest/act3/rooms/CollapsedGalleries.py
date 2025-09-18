from ...engine.Room import Room


class CollapsedGalleries(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Collapsed Galleries",
            description=(
                "Passages pinched by fallen rock; dust motes hang in still air."
            ),
            items=[],
            characters=[],
            exits={"south": "StillnessVestibule", "east": "EchoChambers", "west": "ToolCache"},
        )
