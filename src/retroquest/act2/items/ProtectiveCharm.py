from ...engine.Item import Item
from ..Act2StoryFlags import FLAG_PROTECTIVE_CHARM_USED_FOREST_ENTRANCE

class ProtectiveCharm(Item):
    def __init__(self) -> None:
        super().__init__(
            name="protective charm",
            description=(
                "A small talisman woven from forest vines and blessed by ancient magic. It pulses with a gentle "
                "green light and carries the protective power of the deep woods. This charm will ward off hostile "
                "forest spirits and mark the bearer as one under the hermit's protection."
            ),
            can_be_carried=True,
        )

    def use(self, game_state) -> str:
        if game_state.current_room.name == "Forest Entrance":
            if not game_state.get_story_flag(FLAG_PROTECTIVE_CHARM_USED_FOREST_ENTRANCE):
                game_state.set_story_flag(FLAG_PROTECTIVE_CHARM_USED_FOREST_ENTRANCE, True)
                return ("[spell_effect]The Protective Charm radiates a warm, golden light as you invoke its power. "
                       "A shimmering barrier of spiritual energy surrounds you, and you feel the watchful gaze of "
                       "the forest spirits become less threatening. The ancient magic recognizes your respect and "
                       "preparation, granting you safe passage through these sacred woods.[/spell_effect]")
            else:
                return ("[info]The Protective Charm's energy still surrounds you, providing continued spiritual "
                       "protection in this mystical place.[/info]")
        else:
            return ("The [item_name]protective charm[/item_name] glows softly, providing a sense of comfort and "
                   "protection. It seems most powerful near places of natural magic.")
