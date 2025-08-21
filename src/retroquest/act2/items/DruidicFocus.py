from ...engine.Item import Item

class DruidicFocus(Item):
    def __init__(self) -> None:
        super().__init__(
            name="druidic focus",
            description=(
                "A crystalline focal tool carved from living wood and embedded with "
                "natural crystals. The focus pulses with primal magic, designed to "
                "amplify a spellcaster's connection to nature's power. Ancient druidic "
                "symbols are etched along its length, and touching it fills you with "
                "an understanding of the deep harmony between all living things."
            ),
            can_be_carried=True,
        )

    def use(self, game_state) -> str:
        # Check if player knows any nature-based spells
        nature_spells = [spell for spell in game_state.known_spells 
                        if any(keyword in spell.get_name().lower() 
                              for keyword in ['nature', 'forest', 'heal', 'grow'])]
        
        if nature_spells:
            return ("[success]You grasp the [item_name]druidic focus[/item_name] and feel "
                   "your magical abilities strengthen. The natural crystals resonate with "
                   "your nature-based spells, amplifying your connection to the primal "
                   "forces of growth, healing, and forest magic. Your understanding of "
                   "natural magic deepens significantly.[/success]")
        else:
            return ("[info]You hold the [item_name]druidic focus[/item_name], but without "
                   "knowledge of nature magic, you can only sense its potential. This tool "
                   "would be incredibly powerful for someone versed in druidic arts.[/info]")

    def picked_up(self, game_state) -> str:
        """Called when the item is picked up by the player."""
        if game_state.current_room.name == "Ancient Grove":
            game_state.set_story_flag("druidic_focus_taken", True)
            return ("The polished wood feels warm and alive in your hands, and you can sense its power to amplify nature magic.")
        return ""

    def examine(self, game_state) -> str:
        return ("[event]You examine the [item_name]druidic focus[/item_name]. {0} "
               "The wood appears to be still alive despite being carved, with tiny veins "
               "of green running through it. The embedded crystals seem to capture and "
               "reflect the essence of the natural world - earth, water, air, and the "
               "life force that binds them all together.[/event]".format(self.description))
