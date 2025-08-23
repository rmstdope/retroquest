from ...engine.Room import Room
from ..characters.InnkeeperMarcus import InnkeeperMarcus
from ..characters.BarmaidElena import BarmaidElena
from ..items.RoomKey import RoomKey
from ..items.Door import Door

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
            items=[RoomKey(), Door()],
            characters=[InnkeeperMarcus(), BarmaidElena()],
            exits={"south": "MarketDistrict"}
        )

    def use_key(self) -> str:
        """Called when the room key is used. Unlocks access to the inn rooms."""
        if "east" not in self.exits:
            self.exits["east"] = "InnRooms"
            return "[success]The room key unlocks access to the private inn rooms upstairs. You can now 'go east' to enter the room area.[/success]"
        else:
            return "[info]The inn rooms are already accessible.[/info]"
