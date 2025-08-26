from ...engine.GameState import GameState
from ...engine.Item import Item

class Door(Item):
    def __init__(self) -> None:
        super().__init__(
            name="door",
            short_name="door",
            description="A heavy wooden door reinforced with iron bands. The craftsmanship is solid and reliable, built to withstand the daily traffic of travelers and locals. It leads to the private inn rooms upstairs.",
            can_be_carried=False,
        )

    def use(self, game_state: GameState) -> str:
        from ..rooms.SilverStagInn import SilverStagInn  # Import here to avoid circular imports
        
        # Check if we're in the Silver Stag Inn
        if isinstance(game_state.current_room, SilverStagInn):
            return "[info]The door leads to the private inn rooms upstairs. You can 'go east' to enter the room area.[/info]"
        else:
            return "[info]This door is not accessible from your current location.[/info]"

    def examine(self, game_state: GameState) -> str:
        return ("You examine the door closely. It's made of sturdy oak wood with decorative iron hinges and a simple "
                "latch. The door frame is carved with intricate patterns typical of the inn's welcoming atmosphere. "
                "This door provides access to the upper floor where guests can rent private rooms for rest and storage.")

    def use_with(self, game_state: GameState, target_item) -> str:
        """Handle using the door with other items. Delegates to Room Key if applicable."""
        from .RoomKey import RoomKey  # Import here to avoid circular imports
        if isinstance(target_item, RoomKey):
            # Delegate to the Room Key's use_with method, passing door as the target
            return target_item.use_with(game_state, self)
        else:
            return f"You can't use the door with {target_item.get_name()}."
