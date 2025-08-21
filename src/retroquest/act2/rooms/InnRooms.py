from ...engine.Room import Room
from ...engine.GameState import GameState
from ..items.TravelersJournal import TravelersJournal

class InnRooms(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Inn Rooms",
            description=(
                "Comfortable guest rooms on the upper floor of The Silver Stag Inn. Each room has a cozy bed, a writing desk, "
                "and a window overlooking the Market District. The rooms are clean and well-maintained, providing a peaceful "
                "retreat for travelers. From here, you can hear the gentle murmur of conversation from the common room below."
            ),
            items=[TravelersJournal()],
            characters=[],
            exits={"downstairs": "SilverStagInn"}
        )

    def handle_command(self, command: str, game_state: GameState) -> str:
        # Handle "use room key" command to access the room
        if "use room key" in command.lower():
            room_key = next((item for item in game_state.inventory if "room key" in item.get_name().lower()), None)
            if room_key:
                if not game_state.get_story_flag("accessed_inn_room"):
                    game_state.set_story_flag("accessed_inn_room", True)
                    return ("[success]You use the room key to access your private room. The quiet space allows you "
                            "to study and examine items safely away from the busy common room below. You notice "
                            "a traveler's journal left behind by a previous guest.[/success]")
                else:
                    return "[info]You've already accessed your room and can move freely here.[/info]"
            else:
                return "[failure]You need a room key to access the private rooms.[/failure]"
        
        return super().handle_command(command, game_state)
