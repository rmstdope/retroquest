from ...engine.Item import Item
from typing import Any

class Chicken(Item):
    def __init__(self) -> None:
        super().__init__(
            name="chicken",
            description="A live, clucking chicken. It seems restless and might peck if you're not careful.",
        )
