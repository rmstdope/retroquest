"""Tidal Causeway room and related items for Act 3."""

from ...engine.Room import Room
from ..items import Mural


class TidalCauseway(Room):
    """Moon-washed causeways linking broken arches to half-drowned plazas."""

    def __init__(self) -> None:
        """Initialize Tidal Causeway with mural and exits."""
        super().__init__(
            name="Tidal Causeway",
            description=(
                "Thin causeways of old stone lift from the black water like ribs. "
                "Moonlight skims the wet stones; salt and wind carry half‑heard "
                "songs. Broken arches stand like quiet mouths, guarding what the "
                "sea keeps."
            ),
            items=[Mural()],
            characters=[],
            exits={"north": "ShorelineMarkers", "east": "SubmergedAntechamber"},
        )
