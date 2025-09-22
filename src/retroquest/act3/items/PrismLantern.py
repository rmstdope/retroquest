"""A prismatic lantern used to illuminate underwater passages."""
from ...engine.GameState import GameState
from ...engine.Item import Item


class PrismLantern(Item):
    """A prismatic lantern used to illuminate underwater passages."""

    def __init__(self) -> None:
        super().__init__(
            name="Prism Lantern",
            description=(
                "A faceted lantern of glass ribs and brass, made to scatter light "
                "into clear paths."
            ),
            short_name="lantern",
            can_be_carried=True,
        )

    def picked_up(self, _game_state: GameState) -> str:
        """Handle when the lantern is picked up by the player."""
        return (
            "[info]The lantern's facets refract dim ambient glimmers into a soft fan of "
            "color.[/info]"
        )

    def use_with(self, game_state: GameState, other_item: Item) -> str:
        """Handle using the lantern with another item."""
        from .LanternBracket import LanternBracket
        if isinstance(other_item, LanternBracket):
            hook = getattr(game_state.current_room, 'mount_lantern', None)
            if hook:
                return hook(game_state)
        return super().use_with(game_state, other_item)
