from ...engine.Item import Item
from ...engine.GameState import GameState


class Locker(Item):
    def __init__(self) -> None:
        super().__init__(
            name="Locker",
            description=(
                "A corroded locker lodged under the pier. The lock is fused with salt and time."
            ),
            short_name="locker",
            can_be_carried=False,
        )
        self.locked: bool = True
        self.opened: bool = False

    def examine(self, game_state: GameState) -> str:
        if self.opened:
            return (
                "The locker door hangs open, its hinges complaining softly. The vault beyond is still and cold."
            )
        elif self.locked:
            return (
                "Barnacles crust the seam. The lock looks fused—no ordinary key will turn it as is."
            )
        else:
            return "The fuse has given; the mechanism is free. You can open it now."

    def open(self, game_state: GameState) -> str:
        from .PrismLantern import PrismLantern
        if self.opened:
            return "[info]The locker is already open.[/info]"
        if self.locked:
            return (
                "[failure]You tug at the corroded handle, but the fused lock holds. It won't open while it's locked.[/failure]"
            )
        # Unlock and open: reveal three prism lanterns
        self.opened = True
        for _ in range(3):
            game_state.current_room.items.append(PrismLantern())
        return (
            "[success]With a brittle crack, the door gives. Inside, three prism lanterns gleam behind veils of silt.[/success]"
        )

    # Utility for spells to unlock
    def unlock(self, game_state: GameState) -> str:
        if not self.locked:
            return "[info]The locker mechanism is already freed.[/info]"
        self.locked = False
        return (
            "[event]A subtle click echoes under the pier as the fused pins release. The locker can be opened now.[/event]"
        )
