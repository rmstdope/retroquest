from ...engine.Item import Item
from ...engine.GameState import GameState


class WardingPillars(Item):
    def __init__(self) -> None:
        super().__init__(
            name="Warding Pillars",
            description=(
                "Three leaning pillars ring a drowned courtyard; glyph-lines are clogged with brine and coral crust."
            ),
            short_name="warding pillars",
            can_be_carried=False,
        )
        self.purified: bool = False

    def prevent_pickup(self):
        return (
            "[failure]You can't take the [item_name]Warding Pillars[/item_name]. They are fixed stone, older than the pier."
            "[/failure]"
        )

    def examine(self, game_state: GameState) -> str:
        state = "cleansed" if self.purified else "encrusted"
        return (
            f"[event]The pillars stand weathered and {state}. Channels for a tideward sigil thread their faces; with"
            " proper cleansing and coquina tiles, the ward could be restored.[/event]"
        )

    def purify(self, game_state: GameState) -> str:
        if self.purified:
            return "[info]The pillars are already cleansed of brine and coral.[/info]"
        self.purified = True
        return (
            "[event]You rinse salt and scrape coral from the carved channels. Glyph-lines breathe again, ready to take"
            " the Tideward Sigil.[/event]"
        )
