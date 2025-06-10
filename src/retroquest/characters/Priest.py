from .Character import Character

class Priest(Character):
    def __init__(self) -> None:
        super().__init__(
            name="Priest",
            description="A kindly priest who tends the chapel, offering blessings and sharing the lore of Eldoria."
        )
