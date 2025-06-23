from .Item import Item

class ShinyRing(Item):
    def __init__(self):
        super().__init__(
            name="shiny ring",
            short_name="ring",
            description="A beautiful silver ring with a small, sparkling gemstone. It looks quite valuable.",
            can_be_carried=True
        )
