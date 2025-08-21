from ...engine.GameState import GameState
from ...engine.Item import Item

class ForestSurvivalKit(Item):
    def __init__(self) -> None:
        super().__init__(
            name="forest survival kit",
            description="A comprehensive kit containing everything needed for safe forest exploration: rope, dried food, water purification tablets, protective gear, and magical wards against forest spirits.",
            can_be_carried=True,
        )

    def use(self, game_state: GameState) -> str:
        # Check if we're in Forest Transition for special handling
        current_room = game_state.current_room
        if hasattr(current_room, 'handle_command') and current_room.name == "Forest Transition":
            # Delegate to the room's special handling
            return current_room.handle_command("use forest survival kit", game_state)
        
        # Default behavior for other rooms
        return "You examine the forest survival kit. It contains high-quality gear that would provide essential protection and tools for navigating dangerous forest areas safely."