"""Moonflowers (Act II Rare Herbal Item)

Narrative Role:
    Bioluminescent blossoms tied to protective and divinatory practices. Serve as a premium botanical resource
    foreshadowing advanced healing, warding, or revelation mechanics.

Key Mechanics / Interactions:
    - Contextual use messaging responds to healer spaces vs generic forest vs mundane locations.
    - picked_up() provides special acquisition flavor in WhisperingGlade.
    - No direct flag manipulation; significance emerges through crafting / NPC dialogue opportunities.

Story Flags:
    - Sets/Reads: (none)

Progression Effects:
    Potential ingredient for purification, dream warding, or clairvoyance expansions later.

Design Notes:
    - Could gain potency tiers or freshness decay if alchemy system deepens.
    - Location name string matching keeps current implementation lightweight.
"""

from ...engine.Item import Item
from ...engine.GameState import GameState

class Moonflowers(Item):
    def __init__(self) -> None:
        super().__init__(
            name="moonflowers",
            description=(
                "Ethereal white flowers that bloom only in places where moonlight and "
                "magic converge. Their petals shimmer with a silvery luminescence and "
                "give off a faint, sweet fragrance that seems to calm the mind and spirit. "
                "These rare blossoms are prized by herbalists and magical practitioners "
                "for their ability to enhance divination and provide protection against "
                "nightmares and dark visions."
            ),
            can_be_carried=True,
        )

    def use(self, game_state: GameState) -> str:
        current_room = game_state.current_room.name
        if "healer" in current_room.lower():
            return ("The [item_name]moonflowers[/item_name] would be perfect for Master "
                    "Healer Lyria's advanced remedies and magical preparations.")
        elif "forest" in current_room.lower():
            return ("The [item_name]moonflowers[/item_name] glow more brightly in the "
                    "magical atmosphere of the forest, their protective properties enhanced.")
        else:
            return ("The [item_name]moonflowers[/item_name] remain dormant here. "
                    "They likely have special significance for healing or magical purposes.")

    def picked_up(self, game_state: GameState) -> str:
        """Called when the item is picked up by the player."""
        from ..rooms.WhisperingGlade import WhisperingGlade  # Import here to avoid circular imports
        
        if isinstance(game_state.current_room, WhisperingGlade):
            return ("The moonflowers seem to approve of your gentle touch, their "
                    "silvery glow pulsing warmly as you gather them. These blessed "
                    "blooms will aid in healing and protection magic.")
        return ""

    def examine(self, game_state: GameState) -> str:
        return ("[event]You examine the [item_name]moonflowers[/item_name]. {0} "
                "As you watch, the petals seem to move gently even though there's "
                "no breeze, and you notice tiny motes of silvery light drifting "
                "from the blooms like magical pollen.[/event]".format(self.description))
