from ...engine.GameState import GameState
from ...engine.Item import Item

class RustySaw(Item):
    def __init__(self) -> None:
        super().__init__(
            name="rusty saw",
            description="An old, rusty saw with a worn wooden handle. It looks like it could still cut through something soft, but might break on anything tough.",
            short_name="saw",
            can_be_carried=True
        )
