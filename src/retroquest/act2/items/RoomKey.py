from ...engine.GameState import GameState
from ...engine.Item import Item
from ..Act2StoryFlags import FLAG_ACCESSED_INN_ROOM

class RoomKey(Item):
    def __init__(self) -> None:
        super().__init__(
            name="room key",
            short_name="key",
            description="A brass key to a private room at The Silver Stag Inn. The room provides a quiet space for studying and safe storage of important items.",
            can_be_carried=True,
        )

    def use(self, game_state: GameState) -> str:
        # Check if we're in the Inn Rooms
        if game_state.current_room.name == "Inn Rooms":
            if not game_state.get_story_flag(FLAG_ACCESSED_INN_ROOM):
                game_state.set_story_flag(FLAG_ACCESSED_INN_ROOM, True)
                return ("[success]You use the room key to access your private room. The quiet space allows you "
                        "to study and examine items safely away from the busy common room below. You notice "
                        "a traveler's journal left behind by a previous guest.[/success]")
            else:
                return "[info]You've already accessed your room and can move freely here.[/info]"
        else:
            return "You examine the room key. It grants access to a private room at The Silver Stag Inn where you can study in peace and store valuable items safely."