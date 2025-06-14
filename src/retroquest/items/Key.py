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
        from .MysteriousBox import MysteriousBox # Local import to avoid circular dependency issues at module load time
        if isinstance(target, MysteriousBox):
            if target.locked:
                target.unlock()
                # Remove the key from inventory as it's a one-time use key
                game_state.remove_item_from_inventory(self.get_name())
                return f"You use the {self.get_name()} on the {target.get_name()}. It clicks open!"
            else:
                return f"The {target.get_name()} is already unlocked."
        return f"The {self.get_name()} doesn\\'t seem to work with the {target.get_name()}."

    def use(self, game_state: GameState) -> str:
        """Attempt to use the key by itself, which is not a valid action."""
        return "You try to use the key by itself, but nothing happens. It probably needs to be used with something."
