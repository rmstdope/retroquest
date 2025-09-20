"""Druidic Charm (Act II Sacred Item)

Narrative Role:
    One of the three sacred charms required for the Offering Altar ritual to summon Nyx. Gifted in gratitude,
    it thematically binds acts of protection and healing with ancient natural stewardship.

Key Mechanics / Interactions:
    - Contextual messaging in Heart of the Forest hints at altar placement purpose.
    - Delegates multi-item ritual handling to OfferingAltar via use_with pattern (centralized validation).
    - examine() enriches provenance and emotional weight of the gift event.

Story Flags:
    - Sets: (none directly)
    - Reads: (none)

Progression Effects:
    Required (with ProtectiveCharm and Nature's Charm) to summon Nyx—gateway to deeper forest narrative layers.

Design Notes:
    - Avoids embedding ritual logic locally to prevent duplication across charm classes.
    - Could later gain resonance interactions (e.g., boosting nature spell potency) after Nyx encounter.
"""

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

    def use_with(self, game_state: 'GameState', other_item) -> str:
        """Use the druidic charm with another item."""
        from ..items.OfferingAltar import OfferingAltar
        if isinstance(other_item, OfferingAltar):
            # Delegate to the offering altar's use_with method
            return other_item.use_with(game_state, self)
        else:
            return super().use_with(game_state, other_item)

    def examine(self, _game_state: GameState) -> str:
        return ("[event]You examine the [item_name]druidic charm[/item_name]. {0} "
                "The intricate carvings depict intertwined branches and leaves, symbols "
                "of the eternal cycle of growth and renewal. You can feel the gratitude "
                "and love that Marcus poured into this gift when he gave it to you for "
                "saving his daughter Elena from the dark curse.[/event]".format(self.description))
