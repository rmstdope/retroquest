from ...engine.Room import Room


class CollapsedPier(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Collapsed Pier",
            description=(
                "A shattered jetty with sunken vaults beneath; barnacled beams jut like ribs."
            ),
            items=[],
            characters=[],
            exits={"south": "SanctumOfTheTide", "west": "OuterWards"},
        )
