from ...engine.Item import Item
from ..Act2StoryFlags import FLAG_SILVER_LEAVES_TAKEN

class SilverLeaves(Item):
    def __init__(self) -> None:
        super().__init__(
            name="silver leaves",
            description=(
                "Leaves from the ancient silver-barked tree, each one shimmering with "
                "ethereal light. They feel lighter than air yet possess a tangible warmth "
                "that speaks of deep forest magic. These are sacred tokens, gifts from "
                "the oldest tree spirit in the Enchanted Forest, imbued with the power "
                "to communicate with all growing things."
            ),
            can_be_carried=True,
        )

    def use(self, game_state) -> str:
        current_room = game_state.current_room.name
        if "forest" in current_room.lower() or "grove" in current_room.lower():
            return ("[success]You hold the [item_name]silver leaves[/item_name] aloft and feel "
                   "their connection to the living forest around you. The leaves glow softly, "
                   "and you sense the presence of all the trees, plants, and growing things "
                   "nearby. Through the leaves' magic, you can almost hear the whispered "
                   "conversations of the forest itself.[/success]")
        else:
            return ("The [item_name]silver leaves[/item_name] remain beautiful but feel "
                   "disconnected from their source of power. They would be more potent "
                   "in a natural setting.")

    def picked_up(self, game_state) -> str:
        """Called when the item is picked up by the player."""
        if game_state.current_room.name == "Ancient Grove":
            game_state.set_story_flag(FLAG_SILVER_LEAVES_TAKEN, True)
            return ("Each leaf gleams like polished silver and tingles with forest magic when you touch it.")
        return ""

    def examine(self, game_state) -> str:
        return ("[event]You examine the [item_name]silver leaves[/item_name]. {0} "
               "Each leaf bears intricate patterns that seem to tell the story of the "
               "ancient tree's long life - seasons of growth, years of wisdom, and "
               "countless creatures that have found shelter beneath its branches. "
               "The silver coloring shifts like moonlight on water.[/event]".format(self.description))
