from .Room import Room
from ..items.Rope import Rope
from ..items.Apple import Apple
from ..items.Matches import Matches
from ..characters.Shopkeeper import Shopkeeper

class GeneralStore(Room):
    def __init__(self) -> None:
        super().__init__(
            name="General Store",
            description=(
                "A cluttered shop overflowing with goods of every kind. Shelves groan under the weight of "
                "rope, apples, matches, and trinkets. The shopkeeper bustles about, dusting jars and "
                "chatting with customers. The air is thick with the mingled scents of fruit, wax, and "
                "old wood. Every corner seems to hold a new surprise, and the promise of a good bargain."
            ),
            items=[Rope(), Apple(), Matches()],
            spells=[],
            usable_items=["coin"],
            characters=[Shopkeeper()],
            exits={"west": "VillageSquare", "east": "OldMill"}
        )
