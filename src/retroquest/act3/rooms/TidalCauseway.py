from ...engine.Room import Room


class TidalCauseway(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Tidal Causeway",
            description=(
                "Moon‑washed causeways slick with seaweed rise and fall with the tide, linking broken arches to "
                "half‑drowned plazas."
            ),
            items=[],
            characters=[],
            exits={"north": "ShorelineMarkers", "east": "SubmergedAntechamber"},
        )
