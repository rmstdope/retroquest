from ...engine.Room import Room

class ResidentialQuarter(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Residential Quarter",
            description=(
                "Quiet streets lined with comfortable two-story homes, each with small gardens and workshops. Smoke rises "
                "from chimneys, and the sound of craftsmen at work echoes from various buildings. This is where Greendale's "
                "skilled artisans and middle-class citizens live and work. The atmosphere is peaceful and industrious."
            ),
            items=[],
            characters=[],
            exits={"south": "CastleCourtyard", "north": "HealersHouse", "secret_passage": "HiddenLibrary"}
        )
