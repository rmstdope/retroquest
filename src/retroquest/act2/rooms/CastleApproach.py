from ...engine.Room import Room

class CastleApproach(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Castle Approach",
            description=(
                "A wide avenue lined with statues of Greendale's heroes leads to an impressive castle of white stone. "
                "Tall spires reach toward the sky, and colorful banners snap in the wind. Guards in ceremonial armor "
                "patrol the approach, their presence both welcoming and imposing. This is clearly where power resides "
                "in Greendale."
            ),
            items=[],
            characters=[],
            exits={"south": "MainSquare", "west": "CastleCourtyard"}
        )
