from ...engine.Room import Room

class InnRooms(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Inn Rooms",
            description=(
                "Comfortable guest rooms on the upper floor of The Silver Stag Inn. Each room has a cozy bed, a writing desk, "
                "and a window overlooking the Market District. The rooms are clean and well-maintained, providing a peaceful "
                "retreat for travelers. From here, you can hear the gentle murmur of conversation from the common room below."
            ),
            items=[],
            characters=[],
            exits={"downstairs": "SilverStagInn"}
        )
