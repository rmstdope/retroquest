from .Character import Character

class Shopkeeper(Character):
    def __init__(self) -> None:
        super().__init__(
            name="Shopkeeper",
            description="The owner of the General Store, always bustling about and eager to strike a bargain or share a rumor."
        )
