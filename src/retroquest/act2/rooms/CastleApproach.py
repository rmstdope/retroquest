from ...engine.Room import Room
from ...engine.GameState import GameState
from ..characters.Herald import Herald
from ..characters.CastleGuardCaptain import CastleGuardCaptain

class CastleApproach(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Castle Approach",
            description=(
                "A wide avenue lined with statues of Greendale's heroes leads to an impressive castle of white stone. "
                "Tall spires reach toward the sky, and colorful banners snap in the wind. Guards in ceremonial armor "
                "patrol the approach, their presence both welcoming and imposing. This is clearly where power resides "
                "in Greendale."
            ),
            items=[],
            characters=[Herald(), CastleGuardCaptain()],
            exits={"south": "MainSquare", "west": "CastleCourtyard"}
        )
        self.castle_courtyard_enabled = False

    def get_exits(self, game_state: GameState) -> dict:
        """Override to conditionally include castle courtyard exit only after entry pass is shown to herald."""
        exits = super().get_exits(game_state).copy()
        
        # Remove west exit to CastleCourtyard until entry pass has been shown to herald
        if not self.castle_courtyard_enabled and "west" in exits:
            del exits["west"]
            
        return exits

    def enable_castle_courtyard(self) -> None:
        """Enable the exit to the Castle Courtyard."""
        self.castle_courtyard_enabled = True
