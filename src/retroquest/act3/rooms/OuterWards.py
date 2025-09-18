from ...engine.Room import Room


class OuterWards(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Outer Wards",
            description=(
                "Three leaning pillars surround a drowned courtyard; faint glyphs glow when touched with brine."
            ),
            items=[],
            characters=[],
            exits={"south": "SubmergedAntechamber", "east": "CollapsedPier", "west": "ShorelineMarkers"},
        )
