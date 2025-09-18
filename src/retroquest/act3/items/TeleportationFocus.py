from ...engine.Item import Item
from ...engine.GameState import GameState


class TeleportationFocus(Item):
    def __init__(self) -> None:
        super().__init__(
            name="teleportation focus",
            short_name="focus",
            description=(
                "A crystal prism that hums faintly when held near Mira's spellwork. Its facets catch stray motes of "
                "light and fold them inward, anchoring safe circles between distant thresholds."
            ),
            can_be_carried=False,
        )

    def examine(self, game_state: GameState) -> str:
        return (
            "[event]You study the prism. Within its facets, a dozen reflections of the room hover a breath out of step—"
            "as if each were a doorway waiting for Mira's word.[/event]"
        )

    def prevent_pickup(self) -> str | None:
        return (
            "[character_name]Mira[/character_name] steadies the prism with two fingers. "
            "[dialogue]'Careful. The circle anchors through this focus. I must bear it while the weave is open.'[/dialogue]"
        )
