from ...engine.Room import Room

class WhisperingGlade(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Whispering Glade",
            description=(
                "A peaceful meadow where the forest opens to reveal a small stream babbling over smooth stones. "
                "Wildflowers carpet the ground in brilliant colors, and butterflies dance in the warm sunlight. "
                "The sound of moving water creates a soothing melody, but you occasionally hear voices in the wind - "
                "whispers from unseen forest dwellers sharing ancient secrets."
            ),
            items=[],
            characters=[],
            exits={"west": "ForestEntrance"}
        )
