from ...engine.Room import Room


class EmberGallery(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Ember Gallery",
            description=(
                "A vaulted cavern veined with cooling flows; the air smells of "
                "charcoal and iron."
            ),
            items=[],
            characters=[],
            exits={
                "north": "MirrorTerraces", 
                "east": "PhoenixCrater", 
                "west": "LowerSwitchbacks"
            },
        )
