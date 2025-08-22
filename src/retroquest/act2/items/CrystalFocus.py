from ...engine.Item import Item

class CrystalFocus(Item):
    def __init__(self) -> None:
        super().__init__(
            name="Crystal Focus",
            short_name="crystal",
            description=(
                "A perfectly cut crystal that resonates with magical energy, crafted by ancient practitioners "
                "to amplify and focus spellcasting abilities. The crystal glows with inner light and feels "
                "warm to the touch, enhancing your connection to magical forces. This artifact represents "
                "the pinnacle of magical craftsmanship from ages past."
            ),
            can_be_carried=True,
        )

    def use_item(self, game_state) -> str:
        # This item enhances magical understanding and comprehension of ancient texts
        return ("[success]You focus your magical energy through the [item_name]Crystal Focus[/item_name]. "
                "The crystal amplifies your magical awareness, allowing you to better understand arcane "
                "principles and enhancing your ability to comprehend ancient magical texts. Your connection "
                "to magical forces feels stronger and more refined.[/success]")

    def examine(self, game_state) -> str:
        return ("The [item_name]Crystal Focus[/item_name] is a masterwork of ancient magical craftsmanship. "
                "Its faceted surface catches and amplifies magical energy, and you can feel it resonating "
                "with your own magical abilities. This is clearly a tool created by master enchanters to "
                "enhance the magical arts.")