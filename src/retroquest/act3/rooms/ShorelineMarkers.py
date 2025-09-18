from ...engine.Room import Room


class ShorelineMarkers(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Shoreline Markers",
            description=(
                "Weathered stone steles stand at the surf’s edge, carved with coquina runes encrusted in coral."
            ),
            items=[],
            characters=[],
            exits={"south": "TidalCauseway", "east": "OuterWards"},
        )
