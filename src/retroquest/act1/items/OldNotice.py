from ...engine.Item import Item
from ...engine.GameState import GameState

class OldNotice(Item):
    def __init__(self) -> None:
        super().__init__(
            name="old notice",
            description="A faded piece of parchment pinned to the notice board. The writing is barely legible, but it might contain a clue or warning.",
            short_name="notice"
        )

    def read(self, game_state: GameState) -> str:
        event_msg = f"[event]You read the [item_name]{self.get_name()}[/item_name].\n"
        return event_msg + (
            "The notice is weathered and old, but you can make out some of the words:\n\n"
            "\"[bold]MISSING[/bold] - Our dear cat, Patches, has vanished. Last seen near the old well. "
            "She is very friendly but easily spooked. Responds to her name. "
            "If found, please return to the Hemlock family at the General Store. "
            "A small reward is offered.\""
        )
