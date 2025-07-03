from ...engine.Item import Item
from ...engine.GameState import GameState

class Armor(Item):
    def __init__(self) -> None:
        super().__init__(
            name="armor",
            description="A sturdy leather armor vest that provides protection from harm. Well-crafted and reliable.",
            short_name="armor"
        )

    def prevent_pickup(self) -> str | None:
        """Shopkeeper prevents taking the armor unless it's been purchased."""
        if not self.can_be_carried_flag:
            return f"[character_name]Shopkeeper[/character_name] quickly steps over. [dialogue]'Hold on there, friend! That [item_name]{self.get_name()}[/item_name] is merchandise, not a free sample. If you want it, you'll need to buy it proper-like.'[/dialogue]"
        return None  # Allow pickup if can_be_carried is True

    def use(self, game_state: GameState) -> str:
        return "[event]You examine the [item_name]armor[/item_name]. It looks like it would provide good protection if worn.[/event]"

    def equip(self, game_state: GameState) -> str:
        return "[event]You put on the [item_name]armor[/item_name]. You feel more protected and ready for danger.[/event]"

    def examine(self, game_state: GameState) -> str:
        return "[event]You examine the [item_name]armor[/item_name]. " + self.description + "[/event]"
