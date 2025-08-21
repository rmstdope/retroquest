from ...engine.Room import Room

class GreatHall(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Great Hall",
            description=(
                "A magnificent hall with soaring ceilings supported by massive stone columns. Tapestries depicting "
                "legendary battles cover the walls, and a throne sits on a raised dais at the far end. Sunlight streams "
                "through tall stained-glass windows, casting colorful patterns on the stone floor. This is where the "
                "lords of Greendale hold court and make important decisions."
            ),
            items=[],
            characters=[],
            exits={"east": "CastleCourtyard"}
        )
