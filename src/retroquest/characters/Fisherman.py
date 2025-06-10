from .Character import Character

class Fisherman(Character):
    def __init__(self) -> None:
        super().__init__(
            name="Fisherman",
            description="A weathered old man who spends his days by the riverbank, fishing and humming quiet tunes. He knows much about the river and its secrets."
        )
