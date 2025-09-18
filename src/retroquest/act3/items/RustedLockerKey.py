from ...engine.Item import Item
from ...engine.GameState import GameState

class RustedLockerKey(Item):
    def __init__(self) -> None:
        super().__init__(
            name="Rusted Locker Key",
            description=(
                "A corroded iron key recovered from the pier vaults. Its teeth are pitted with salt and age."
            ),
            short_name="rusted locker key",
            can_be_carried=True,
        )

    def picked_up(self, game_state: GameState) -> str:
        return "[info]Its teeth are ragged with corrosion; it might fit, but the lock has long since fused.[/info]"

    def use_with(self, game_state: GameState, other: Item) -> str:
        from .Locker import Locker
        if isinstance(other, Locker):
            return (
                "[failure]You work the key into the corroded lock, but the fused pins refuse to budge."
                " You'll need more than metal to free it.[/failure]"
            )
        return super().use_with(game_state, other)
