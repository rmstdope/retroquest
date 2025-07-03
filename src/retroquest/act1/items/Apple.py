from ...engine.GameState import GameState
from ...engine.Item import Item

class Apple(Item):
    def __init__(self) -> None:
        super().__init__(
            name="apple",
            description="A crisp, red apple. It looks fresh and delicious, perfect for a quick snack."
        )

    def prevent_pickup(self) -> str | None:
        """Shopkeeper prevents taking the apple unless it's been given/purchased."""
        if not self.can_be_carried_flag:
            return f"[character_name]Shopkeeper[/character_name] quickly steps over. [dialogue]'Hold on there, friend! That [item_name]{self.get_name()}[/item_name] is merchandise, not a free sample. If you want it, you'll need to buy it proper-like.'[/dialogue]"
        return None  # Allow pickup if can_be_carried is True
