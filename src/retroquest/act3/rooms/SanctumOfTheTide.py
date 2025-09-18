from ...engine.Room import Room
from ..items import CrystalOfLight


class SanctumOfTheTide(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Sanctum of the Tide",
            description=(
                "A domed chamber where water stands glass‑still; sigils ripple across the surface like starlight."
            ),
            items=[CrystalOfLight()],
            characters=[],
            exits={"north": "CollapsedPier", "west": "SubmergedAntechamber"},
        )
