from ...Room import Room
from ..items.RustySaw import RustySaw
from ..items.TravelCloak import TravelCloak
from ..characters.Merchant import Merchant

class RoadToGreendale(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Road to Greendale",
            description=(
                "The main road leaving Willowbrook stretches beneath ancient oaks, their branches arching "
                "overhead like a living tunnel. The path is well-trodden, lined with wildflowers and "
                "scattered leaves. A merchant's cart creaks nearby, and the air is filled with the promise "
                "of adventure and the unknown. The road beckons, leading onward to new lands and new "
                "stories."
            ),
            items=[RustySaw()],
            characters=[Merchant()],
            exits={"west": "VillageChapel"}
        )
