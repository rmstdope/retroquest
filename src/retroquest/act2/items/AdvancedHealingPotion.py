from ...engine.Item import Item

class AdvancedHealingPotion(Item):
    def __init__(self) -> None:
        super().__init__(
            name="Advanced Healing Potion",
            description=(
                "A crystal vial containing a luminescent healing elixir created by Master Healer Lyria. "
                "The potion glows with a soft blue light and has the power to heal even the most serious "
                "injuries and ailments. This potent remedy represents the pinnacle of the healing arts."
            ),
            can_be_carried=True,
        )

    def use_item(self, game_state) -> str:
        # This item is used for emergency healing during "The Healer's Apprentice" quest
        return ("[success]You drink the [item_name]Advanced Healing Potion[/item_name]. Powerful healing energy "
                "courses through your body, restoring your health to peak condition and curing any ailments. "
                "The potion's magic is so potent it could save lives that normal healing couldn't reach.[/success]")

    def use_item_on_character(self, game_state, target_character):
        """Use the potion on another character for emergency healing"""
        return (f"[success]You give the [item_name]Advanced Healing Potion[/item_name] to "
                f"[character_name]{target_character.get_name()}[/character_name]. They drink it gratefully, "
                f"and powerful healing energy restores their health to peak condition, curing any serious "
                f"ailments they may have had.[/success]")