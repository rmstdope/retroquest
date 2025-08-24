from ...engine.GameState import GameState
from ...engine.Item import Item
from ..Act2StoryFlags import FLAG_HERMITS_WARNING_COMPLETED

class ForestSurvivalKit(Item):
    def __init__(self) -> None:
        super().__init__(
            name="forest survival kit",
            short_name="kit",
            description="A comprehensive kit containing everything needed for safe forest exploration: dried food, water purification tablets, protective gear, a compass, and magical wards against forest spirits.",
            can_be_carried=True,
        )

    def use(self, game_state: GameState) -> str:
        # Check if we're in Forest Transition for special handling
        current_room = game_state.current_room
        if current_room.name == "Forest Transition":
            game_state.set_story_flag(FLAG_HERMITS_WARNING_COMPLETED, True)
            return ("[success]You open the [item_name]forest survival kit[/item_name] and spread its contents. "
                    "The compass points true north, the protective gear fits snugly, "
                    "and the dried rations remind you to prepare for a long journey. Most importantly, you "
                    "study the forest map, learning the locations of safe camping spots and which areas to avoid. "
                    "You feel much more prepared for wilderness survival. You can now safely enter the forest.[/success]")
        
        # Default behavior for other rooms
        return "You examine the forest survival kit. It contains high-quality gear that would provide essential protection and tools for navigating dangerous forest areas safely. Now is not the time to use it."
    