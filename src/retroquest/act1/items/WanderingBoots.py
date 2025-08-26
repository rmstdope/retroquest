from ...engine.GameState import GameState
from ...engine.Item import Item
from typing import Any

class WanderingBoots(Item):
    def __init__(self) -> None:
        super().__init__(
            name="wandering boots",
            description="Sturdy leather boots, well-worn and comfortable. They seem to hum with a faint energy, eager for the road.",
            short_name="boots",
            can_be_carried=True
        )
