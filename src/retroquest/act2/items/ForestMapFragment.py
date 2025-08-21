from ...engine.Item import Item

class ForestMapFragment(Item):
    def __init__(self) -> None:
        super().__init__(
            name="forest map fragment",
            description=(
                "A torn piece of parchment showing ancient forest paths and landmarks. "
                "The ink is faded but still legible, marking safe routes through dangerous "
                "areas and indicating hidden groves. This partial map was clearly created "
                "by someone with intimate knowledge of the Enchanted Forest's secrets."
            ),
            can_be_carried=True,
        )

    def use(self, game_state) -> str:
        current_room = game_state.current_room.name
        if current_room == "Forest Entrance":
            if not game_state.get_story_flag("forest_map_used_forest_entrance"):
                game_state.set_story_flag("forest_map_used_forest_entrance", True)
                return ("[item_effect]The Forest Map Fragment glows softly as you study it, revealing ancient "
                       "pathways and sacred sites within the Enchanted Forest. The map shows the Ancient Grove "
                       "to the south as a place of great power, where the oldest tree spirit dwells. To the east, "
                       "the Whispering Glade is marked as a place of reflection and water magic. The map's "
                       "enchantment guides you, ensuring you won't lose your way in these mystical woods.[/item_effect]")
            else:
                return ("[info]Consulting the Forest Map Fragment again, you confirm your bearings. The Ancient "
                       "Grove lies to the south, and the Whispering Glade to the east.[/info]")
        elif "forest" in current_room.lower():
            return ("[success]You consult the [item_name]forest map fragment[/item_name] and study "
                   "the ancient markings. The partial map reveals several safe paths through the "
                   "enchanted woods, warning of areas where the trees themselves might lead you "
                   "astray. Following the marked routes, you can navigate more safely through "
                   "this magical wilderness.[/success]")
        else:
            return ("The [item_name]forest map fragment[/item_name] shows forest paths, but "
                   "would be more useful once you're actually in the enchanted woods.")

    def examine(self, game_state) -> str:
        return ("[event]You examine the [item_name]forest map fragment[/item_name]. {0} "
               "The parchment shows winding trails marked with druidic symbols indicating "
               "safe passage, dangerous areas to avoid, and mysterious locations marked with "
               "ancient runes. Some paths lead to sacred groves, while others are marked "
               "with warnings about hostile forest guardians.[/event]".format(self.description))
