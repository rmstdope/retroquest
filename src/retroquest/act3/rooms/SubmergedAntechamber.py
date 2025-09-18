from ...engine.Room import Room


class SubmergedAntechamber(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Submerged Antechamber",
            description=(
                "A partially flooded hall; carved niches hold lantern brackets; light lines the underwater path."
            ),
            items=[],
            characters=[],
            exits={"north": "OuterWards", "east": "SanctumOfTheTide", "west": "TidalCauseway"},
        )
