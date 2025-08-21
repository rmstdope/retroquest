from ...engine.Room import Room
from ...engine.GameState import GameState
from ..characters.InnkeeperMarcus import InnkeeperMarcus
from ..characters.BarmaidElena import BarmaidElena

class SilverStagInn(Room):
    def __init__(self) -> None:
        super().__init__(
            name="The Silver Stag Inn",
            description=(
                "A three-story inn with warm yellow light spilling from its windows. The common room buzzes with conversation "
                "from travelers, locals, and adventurers sharing tales over hearty meals and strong ale. Mounted stag heads "
                "and adventuring trophies decorate the walls. The atmosphere is welcoming, and you sense this is where "
                "information flows as freely as the drink."
            ),
            items=[],
            characters=[InnkeeperMarcus(), BarmaidElena()],
            exits={"south": "MarketDistrict", "upstairs": "InnRooms"}
        )

    def handle_command(self, command: str, game_state: GameState) -> str:
        # Handle "buy room key" command
        if "buy room key" in command.lower():
            # Find coins in inventory
            coins = next((item for item in game_state.inventory if item.get_name().lower() == "coins"), None)
            if not coins or coins.get_amount() < 10:
                return "[failure]You don't have enough coins to rent a room (costs 10 gold).[/failure]"
            
            # Check if already have room key
            if any(item.get_name().lower() == "room key" for item in game_state.inventory):
                return "[info]You already have a room key.[/info]"
            
            # Purchase room key
            coins.spend(10)
            from ..items.RoomKey import RoomKey
            game_state.inventory.append(RoomKey())
            return ("[success]You pay 10 gold coins to [character_name]Innkeeper Marcus[/character_name] for a room. "
                    "He hands you a brass key and explains how to access the private rooms upstairs.[/success]")
        
        return super().handle_command(command, game_state)
