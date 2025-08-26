from ...engine.Item import Item
from ..Act2StoryFlags import FLAG_MOONFLOWERS_TAKEN

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

    def use(self, game_state) -> str:
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

# TODO Is this ever used?
    def picked_up(self, game_state) -> str:
        """Called when the item is picked up by the player."""
        from ..rooms.WhisperingGlade import WhisperingGlade  # Import here to avoid circular imports
        
        if isinstance(game_state.current_room, WhisperingGlade):
            game_state.set_story_flag(FLAG_MOONFLOWERS_TAKEN, True)
            return ("The moonflowers seem to approve of your gentle touch, their "
                    "silvery glow pulsing warmly as you gather them. These blessed "
                    "blooms will aid in healing and protection magic.")
        return ""

    def examine(self, game_state) -> str:
        return ("[event]You examine the [item_name]moonflowers[/item_name]. {0} "
                "As you watch, the petals seem to move gently even though there's "
                "no breeze, and you notice tiny motes of silvery light drifting "
                "from the blooms like magical pollen.[/event]".format(self.description))
