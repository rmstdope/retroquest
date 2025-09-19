from ...engine.Room import Room


class FortressEntrance(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Entrance to Malakar's Fortress",
            description=(
                "A blackstone bastion rises from a shattered ridge; gate sigils pulse "
                "like a heartbeat behind iron lattices. The air tastes of cold metal and "
                "distant thunder."
            ),
            items=[],
            characters=[],
            exits={},
        )
