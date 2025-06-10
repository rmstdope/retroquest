from .Character import Character

class Blacksmith(Character):
    def __init__(self) -> None:
        super().__init__(
            name="Blacksmith",
            description="A burly, skilled craftsman who forges tools and weapons for the village. He is always ready to offer advice or sharpen a blade."
        )
