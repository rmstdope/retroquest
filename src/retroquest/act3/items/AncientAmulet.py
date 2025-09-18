from ...engine.Item import Item
from ...engine.GameState import GameState


class AncientAmulet(Item):
    def __init__(self) -> None:
        super().__init__(
            name="ancient amulet",
            short_name="amulet",
            description=(
                "A family heirloom whose runes glint like dew at dawn. It seems to answer the presence of the three relics."
            ),
            can_be_carried=False,
        )

    def prevent_pickup(self) -> str | None:
        return (
            "[character_name]Mira[/character_name] lays a gentle hand upon the [item_name]amulet[/item_name]. "
            "[dialogue]'Not yet. It will choose its bearer when the circle is complete.'[/dialogue]"
        )
