from ...engine.Room import Room
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
            exits={"south": "MarketDistrict", "east": "InnRooms"}
        )
