from ...engine.Room import Room
from ..items.Lantern import Lantern
from ..items.Bread import Bread
from ..items.EliorsJournal import EliorsJournal
from ..characters.Grandmother import Grandmother

class EliorsCottage(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Elior's Cottage",
            description=(
                "A modest cottage with a straw roof and a cozy hearth. The scent of fresh bread and old "
                "books fills the air. Sunlight filters through lace curtains, illuminating shelves lined "
                "with trinkets and memories. A sturdy wooden table sits in the center, and a gentle fire "
                "crackles in the hearth. Grandmother hums softly in her rocking chair, her eyes twinkling "
                "with wisdom and warmth."
            ),
            items=[Lantern()],
            characters=[Grandmother()],
            exits={}  # Start with empty exits
        )

    def can_leave(self):
        # Fill exits when this method is called
        if not self.exits:
            self.exits = {"south": "VegetableField", "east": "VillageSquare"}
