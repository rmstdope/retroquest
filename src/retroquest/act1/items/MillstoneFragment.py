from ...engine.GameState import GameState
from ...engine.Item import Item

class MillstoneFragment(Item):
    def __init__(self) -> None:
        super().__init__(
            name="millstone fragment",
            description="A chunk of stone broken from the old mill's grinding wheel. It's heavy and rough, but could be useful for repairs or as a tool.",
            short_name="fragment",
            can_be_carried=True
        )
