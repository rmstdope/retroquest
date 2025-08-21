from ...engine.Item import Item

class CrystalClearWater(Item):
    def __init__(self) -> None:
        super().__init__(
            name="crystal-clear water",
            description=(
                "Water from the sacred spring in the Whispering Glade, this liquid is "
                "so pure it seems to glow with its own inner light. The water has been "
                "blessed by the water nymphs and carries powerful purification magic "
                "that can break curses and cleanse dark enchantments. Each drop sparkles "
                "like liquid starlight, and the container feels cool to the touch."
            ),
            can_be_carried=True,
        )

    def use(self, game_state) -> str:
        current_room = game_state.current_room.name
        if "silver stag inn" in current_room.lower():
            # This should be used to purify Elena's curse
            return ("The [item_name]crystal-clear water[/item_name] glows with purification magic. "
                   "It should be used on someone who needs cleansing from dark enchantments.")
        elif "ancient grove" in current_room.lower():
            return ("The [item_name]crystal-clear water[/item_name] resonates with the sacred "
                   "energy of this grove, ready to be used for powerful purification rituals.")
        else:
            return ("The [item_name]crystal-clear water[/item_name] remains inert here. "
                   "It likely has special significance in places of healing or purification.")

    def picked_up(self, game_state) -> str:
        """Called when the item is picked up by the player."""
        if game_state.current_room.name == "Whispering Glade":
            game_state.set_story_flag("crystal_clear_water_taken", True)
            return ("The water nymphs nod approvingly as you collect their sacred gift. "
                   "This blessed water will serve you well in breaking dark enchantments.")
        return ""

    def examine(self, game_state) -> str:
        return ("[event]You examine the [item_name]crystal-clear water[/item_name]. {0} "
               "The liquid moves with an otherworldly fluidity, and you can sense the "
               "powerful purification magic contained within. This water could break "
               "even the strongest curses.[/event]".format(self.description))
