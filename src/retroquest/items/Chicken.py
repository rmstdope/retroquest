from .Item import Item

class Chicken(Item):
    def __init__(self):
        super().__init__(
            name="chicken",
            description="A live, clucking chicken. It seems restless and might peck if you\'re not careful.",
        )
