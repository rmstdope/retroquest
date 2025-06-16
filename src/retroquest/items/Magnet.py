from .Item import Item

class Magnet(Item):
    def __init__(self):
        super().__init__(
            name="magnet",
            description="A small, surprisingly strong magnet. It might be useful for retrieving metallic objects from hard-to-reach places.",
            can_be_carried=True
        )
