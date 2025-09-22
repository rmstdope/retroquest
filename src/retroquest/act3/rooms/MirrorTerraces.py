"""Module defining the MirrorTerraces room in Act 3."""
from ...engine.Room import Room


class MirrorTerraces(Room):
    """The Mirror Terraces: stepped platforms with sockets for polished mirrors."""
    def __init__(self) -> None:
        super().__init__(
            name="Mirror Terraces",
            description=(
                "Stepped platforms with sockets for polished mirrors; channels etched "
                "to carry focused light uphill."
            ),
            items=[],
            characters=[],
            exits={
                "south": "EmberGallery",
                "east": "FumarolePassages",
                "west": "ObsidianOutcrops"
            },
        )
