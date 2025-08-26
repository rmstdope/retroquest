from typing import Any
from ...engine.Room import Room
from ..items.Lantern import Lantern
from ..items.Bread import Bread
from ..items.EliorsJournal import EliorsJournal
from ..characters.Grandmother import Grandmother
from ..items.FadedPhotograph import FadedPhotograph
from ..Act1StoryFlags import FLAG_FOUND_PHOTO

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

    def can_leave(self) -> None:
        # Fill exits when this method is called
        if not self.exits:
            self.exits = {"south": "VegetableField", "east": "VillageSquare"}

    def search(self, game_state: Any) -> str:
        # If the faded photograph hasn't been found yet, add it and set the flag
        if not game_state.get_story_flag(FLAG_FOUND_PHOTO):
            photo = FadedPhotograph()
            self.items.append(photo)
            game_state.set_story_flag(FLAG_FOUND_PHOTO, True)
            return f"You search the cottage thoroughly and discover a [item_name]{photo.get_name()}[/item_name] hidden in a drawer."
        return "You search the cottage but find nothing new."
