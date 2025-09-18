from ...engine.Item import Item
from ...engine.GameState import GameState


class HealingHerbs(Item):
    def __init__(self) -> None:
        super().__init__(
            name="healing herbs",
            short_name="herbs",
            description=(
                "Bundles of resin-sweet stems and silverleaf—Mira's own blends for stabilizing wounds and focusing rites."
            ),
            can_be_carried=False,
        )

    def prevent_pickup(self) -> str | None:
        return (
            "[character_name]Mira[/character_name] lifts a sachet, then shakes her head. "
            "[dialogue]'Leave these for the circles and crossings. When the rite calls for them, I will place them in your hands.'[/dialogue]"
        )

    def use(self, game_state: GameState) -> str:
        return (
            "You sort the sachets by scent and potency. Mira's mix will steady breath and sharpen focus—"
            "useful in rites and long treks between thresholds."
        )
