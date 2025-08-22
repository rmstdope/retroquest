from ...engine.Room import Room
from ...engine.GameState import GameState
from ..characters.SirCedric import SirCedric

class CastleCourtyard(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Castle Courtyard",
            description=(
                "An expansive courtyard within the castle walls, featuring training grounds where knights practice their "
                "swordwork. Ancient oak trees provide shade for stone benches, and a stable houses magnificent warhorses. "
                "The castle's main hall rises before you, its great doors carved with the symbols of Greendale's noble houses."
            ),
            items=[],
            characters=[SirCedric()],
            exits={"east": "CastleApproach", "north": "ResidentialQuarter", "west": "GreatHall"}
        )
