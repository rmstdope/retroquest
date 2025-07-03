from ...engine.GameState import GameState
from ...engine.Item import Item

#TODO No completion on 'shiny'
class ShinyRing(Item):
    def __init__(self):
        super().__init__(
            name="shiny ring",
            short_name="ring",
            description="A beautiful silver ring with a small, sparkling gemstone. It looks quite valuable.",
            can_be_carried=True
        )
