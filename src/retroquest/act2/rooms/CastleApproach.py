"""Castle Approach (Act II)

Narrative Role:
    ceremonial processional leading from civic center to noble power. Establishes social hierarchy and
    acts as preliminary gate to castle interior spaces (Courtyard, GreatHall).

Key Mechanics:
    - West exit to CastleCourtyard suppressed until enable_castle_courtyard() is invoked (triggered by presenting entry pass to Herald).
    - get_exits() clones parent exits then prunes conditionally (non-destructive base data design).

Story Flags:
    - None read directly; gating handled via local boolean set by NPC interaction logic elsewhere.

Contents:
    - NPCs: Herald (formal protocol), CastleGuardCaptain (authority presence / potential future gate escalation).
    - Items: None (keeps focus on social interaction).

Design Notes:
    - Boolean approach keeps state internal; could migrate to story flag if cross-room logic later requires awareness.
    - Method enable_castle_courtyard isolates mutation, preserving single responsibility.
"""

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
