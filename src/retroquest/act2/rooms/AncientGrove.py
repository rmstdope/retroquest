from ...engine.Room import Room

class AncientGrove(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Ancient Grove",
            description=(
                "A circular clearing dominated by trees so old and massive they seem to touch the sky. Their bark bears "
                "carved symbols that predate human memory, and the air shimmers with concentrated magic. At the center "
                "grows a tree unlike any other - its silver bark gleams and its leaves whisper secrets in an ancient "
                "tongue. This is clearly a place of power and the sacred gateway to the forest's deepest mysteries."
            ),
            items=[],
            characters=[],
            exits={"north": "ForestEntrance", "south": "HeartOfTheForest"}
        )
