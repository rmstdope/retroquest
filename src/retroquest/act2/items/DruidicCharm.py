from ...engine.Item import Item
from ...engine.GameState import GameState

class DruidicCharm(Item):
    def __init__(self) -> None:
        super().__init__(
            name="druidic charm",
            description=(
                "An ancient charm carved from sacred oak and blessed by generations "
                "of druids. The wooden pendant is etched with mystical symbols that "
                "seem to pulse with natural magic. Wrapped in silver wire and suspended "
                "from a leather cord, it emanates a warm, protective energy. This sacred "
                "charm represents the bond between nature and civilization."
            ),
            can_be_carried=True,
        )

    def use(self, game_state: GameState) -> str:
        current_room = game_state.current_room.name
        if "heart of the forest" in current_room.lower():
            return ("The [item_name]druidic charm[/item_name] resonates with the mystical "
                    "energy of this sacred place. It should be placed on the offering altar "
                    "along with other sacred items to perform powerful rituals.")
        else:
            return ("The [item_name]druidic charm[/item_name] glows faintly with natural magic. "
                    "It feels especially potent here, but you sense it has a greater purpose "
                    "that requires the right location and companions.")

    def examine(self, game_state: GameState) -> str:
        return ("[event]You examine the [item_name]druidic charm[/item_name]. {0} "
                "The intricate carvings depict intertwined branches and leaves, symbols "
                "of the eternal cycle of growth and renewal. You can feel the gratitude "
                "and love that Marcus poured into this gift when he gave it to you for "
                "saving his daughter Elena from the dark curse.[/event]".format(self.description))
