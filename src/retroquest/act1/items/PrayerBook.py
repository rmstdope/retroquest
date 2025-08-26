from ...engine.GameState import GameState
from ...engine.Item import Item

class PrayerBook(Item):
    def __init__(self) -> None:
        super().__init__(
            name="prayer book",
            description="A small, leather-bound book filled with prayers and hymns. The pages are worn from years of use.",
            short_name="book"
        )

    def read(self, game_state: GameState) -> str:
        event_msg = f"[event]You read the [item_name]{self.get_name()}[/item_name].\n"
        return event_msg + (
            "The pages shimmer with shifting runes and cryptic sigils. As you try to focus, the words seem to rearrange themselves: "
            "'By the moon's forgotten echo, let the silent bells resound...'\n"
            "But the rest dissolves into a swirl of arcane nonsense. You feel a faint tingle in your fingertips."
        )
