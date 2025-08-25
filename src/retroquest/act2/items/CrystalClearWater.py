from ...engine.Item import Item
from ..Act2StoryFlags import FLAG_CRYSTAL_CLEAR_WATER_TAKEN

class CrystalClearWater(Item):
    def __init__(self) -> None:
        super().__init__(
            name="crystal-clear water",
            short_name="water",
            description=(
                "Water from the sacred spring in the Whispering Glade, this liquid is "
                "so pure it seems to glow with its own inner light. The water has been "
                "blessed by the water nymphs and carries powerful purification magic "
                "that can break curses and cleanse dark enchantments. Each drop sparkles "
                "like liquid starlight, and the container feels cool to the touch."
            ),
            can_be_carried=True,
        )

    def use_on_character(self, game_state, target_character) -> str:
        """Use crystal-clear water on a character to purify them."""
        # Special handling for Elena's curse purification
        if target_character.get_name().lower() == "barmaid elena":
            return target_character.receive_crystal_water_purification(game_state)
        else:
            return (f"The [item_name]crystal-clear water[/item_name] glows faintly when near "
                    f"[character_name]{target_character.get_name()}[/character_name], but it seems "
                    f"this blessed water is meant for someone specifically afflicted by dark magic.")

    def examine(self, game_state) -> str:
        return ("[event]You examine the [item_name]crystal-clear water[/item_name]. {0} "
                "The liquid moves with an otherworldly fluidity, and you can sense the "
                "powerful purification magic contained within. This water could break "
                "even the strongest curses.[/event]".format(self.description))
