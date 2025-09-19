from ...engine.Room import Room


class FumarolePassages(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Fumarole Passages",
            description=(
                "Narrow tunnels exhaling rhythmic heat; stone vents chuff like a great "
                "sleeping bellows."
            ),
            items=[],
            characters=[],
            exits={"south": "PhoenixCrater", "west": "MirrorTerraces"},
        )
