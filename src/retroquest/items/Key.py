from ..GameState import GameState
from .Item import Item

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
        return f"The [item.name]{self.get_name()}[/item.name] doesn\'t seem to work with the [item.name]{target.get_name()}[/item.name]."

    def use(self, game_state: GameState) -> str:
        """Attempt to use the key by itself, which is not a valid action."""
        return f"You try to use the [item.name]{self.get_name()}[/item.name] by itself, but nothing happens. It probably needs to be used with something."
