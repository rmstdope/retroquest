from ...engine.GameState import GameState
from ...engine.Item import Item
from ..Act2StoryFlags import FLAG_HELPED_ELDERLY_RESIDENTS

class WalkingStick(Item):
    def __init__(self) -> None:
        super().__init__(
            name="walking stick",
            short_name="stick",
            description="A sturdy wooden walking stick worn smooth by many travelers. It provides reliable support on mountain paths and could serve as a makeshift weapon if needed.",
            can_be_carried=True,
        )

    def use(self, game_state: GameState) -> str:
        # Check if we're in the Residential Quarter to help elderly residents
        if (game_state.current_room.name == "Residential Quarter" and 
            not game_state.get_story_flag(FLAG_HELPED_ELDERLY_RESIDENTS)):
            game_state.set_story_flag(FLAG_HELPED_ELDERLY_RESIDENTS, True)
            return ("[success]You use your walking stick to help several elderly residents navigate the uneven "
                    "cobblestones and carry their heavy loads. Your assistance is greatly appreciated, and the "
                    "community takes note of your kind and helpful nature. Word spreads that you are someone "
                    "who cares about others.[/success]")
        elif (game_state.current_room.name == "Residential Quarter" and 
              game_state.get_story_flag(FLAG_HELPED_ELDERLY_RESIDENTS)):
            return "[info]You've already helped the elderly residents in this area.[/info]"
        else:
            return "You lean on the walking stick, feeling more stable on the rocky mountain path. It's a trustworthy companion for any journey."
