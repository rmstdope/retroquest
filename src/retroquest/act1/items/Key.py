from ...engine.GameState import GameState
from ...engine.Item import Item

class Key(Item):
    def __init__(self) -> None:
        super().__init__(
            name="key",
            description="A small, rusty key. It looks like it might unlock something.",
            can_be_carried=True
        )

    def use_with(self, game_state: GameState, target: Item):
        from .ShedDoor import ShedDoor  # Local import to avoid circular dependency issues at module load time
        if isinstance(target, ShedDoor):
            return target.use_with(game_state, self)
        return super().use_with(game_state, target)
