from ...engine.Room import Room
from ..characters.InnkeeperMarcus import InnkeeperMarcus
from ..characters.BarmaidElena import BarmaidElena
from ..items.RoomKey import RoomKey

class SilverStagInn(Room):
    def __init__(self) -> None:
        # Create the room key display item immediately
        wares = self.add_wares()
        
        super().__init__(
            name="The Silver Stag Inn",
            description=(
                "A three-story inn with warm yellow light spilling from its windows. The common room buzzes with conversation "
                "from travelers, locals, and adventurers sharing tales over hearty meals and strong ale. Mounted stag heads "
                "and adventuring trophies decorate the walls. The atmosphere is welcoming, and you sense this is where "
                "information flows as freely as the drink."
            ),
            items=wares,
            characters=[InnkeeperMarcus(), BarmaidElena()],
            exits={"south": "MarketDistrict", "east": "InnRooms"}
        )

    def add_wares(self) -> list:
        """Create and return the innkeeper's available room key (non-carriable display item)"""
        room_key = RoomKey()
        room_key.can_be_carried = False
        
        return [room_key]
