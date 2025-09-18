from ...engine.Item import Item
from ...engine.GameState import GameState


class PrismLantern(Item):
    def __init__(self) -> None:
        super().__init__(
            name="Prism Lantern",
            description=(
                "A faceted lantern of glass ribs and brass, made to scatter light into clear paths."
            ),
            short_name="lantern",
            can_be_carried=True,
        )

    def picked_up(self, game_state: GameState) -> str:
        return "[info]The lantern’s facets refract dim ambient glimmers into a soft fan of color.[/info]"

    def use_with(self, game_state: GameState, other: Item) -> str:
        from .LanternBracket import LanternBracket
        if isinstance(other, LanternBracket):
            hook = getattr(game_state.current_room, 'mount_lantern', None)
            if hook:
                return hook(game_state)
        return super().use_with(game_state, other)
