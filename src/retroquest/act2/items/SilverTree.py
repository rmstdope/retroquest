from ...engine.Item import Item
from ..Act2StoryFlags import FLAG_SILVER_TREE_EXAMINED

class SilverTree(Item):
    def __init__(self) -> None:
        super().__init__(
            name="silver-barked tree",
            short_name="tree",
            description=(
                "A magnificent ancient tree that towers above all others, its silver bark shimmering "
                "with an inner light that seems to pulse in rhythm with your heartbeat. The bark is smooth "
                "as polished metal yet warm to the touch, and intricate spiraling patterns flow across its "
                "surface like living veins of starlight. This is the dwelling place of the Ancient Tree Spirit."
            ),
            can_be_carried=False,
        )
        self.examined = False

    def examine(self, game_state) -> str:
        """Examine the magnificent silver-barked tree."""
        if not self.examined:
            self.examined = True
            game_state.set_story_flag(FLAG_SILVER_TREE_EXAMINED, True)
            return (
                "[environment_description]The ancient tree towers above you, its silver bark shimmering "
                "with an inner light that seems to pulse in rhythm with your heartbeat. The bark is smooth "
                "as polished metal yet warm to the touch, and intricate spiraling patterns flow across its "
                "surface like living veins of starlight. Its massive canopy spreads wide, with leaves that "
                "catch and reflect light in impossible ways. You sense an ancient presence within - older "
                "than memory, wise beyond measure, and deeply connected to the very essence of the forest. "
                "This is no mere tree, but the dwelling place of the Ancient Tree Spirit.[/environment_description]"
            )
        else:
            return (
                "[environment_description]The magnificent silver-barked tree continues to radiate ancient "
                "power and wisdom. Its presence fills you with a sense of reverence and connection to "
                "the natural world.[/environment_description]"
            )
