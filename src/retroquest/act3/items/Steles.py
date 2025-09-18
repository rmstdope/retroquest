from ...engine.Item import Item
from ...engine.GameState import GameState

class Steles(Item):
    def __init__(self) -> None:
        super().__init__(
            name="Steles",
            description=(
                "Weathered stone pillars at the surf’s edge. Coquina carvings trace ward sigils beneath coral crust."
            ),
            short_name="steles",
            can_be_carried=False,
        )

    def prevent_pickup(self):
        return (
            "[failure]You can't take the [item_name]Steles[/item_name]. They are part of the shore itself—heavy and set."
            "[/failure]"
        )

    def examine(self, game_state: GameState) -> str:
        return (
            "[event]The steles are carved from coquina, their pores packed with salt. Runes repeat in a pattern that"
            " suggests warding. Loose fragments glint in crevices—useful for completing tidebound sigils.[/event]"
        )
