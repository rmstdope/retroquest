from ...GameState import GameState
from ...Item import Item

class WanderingBoots(Item):
    def __init__(self):
        super().__init__(
            name="Wandering Boots",
            description="Sturdy leather boots, well-worn and comfortable. They seem to hum with a faint energy, eager for the road.",
            short_name="boots",
            can_be_carried=True
        )
