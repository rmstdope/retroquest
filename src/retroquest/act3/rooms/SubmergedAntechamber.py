"""Flooded antechamber with lantern mounting system for underwater passage."""
from ...engine.GameState import GameState
from ...engine.Room import Room
from ..Act3StoryFlags import (
    FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT,
    FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED,
)
from ..items import LanternBracket, PrismLantern


class SubmergedAntechamber(Room):
    """Flooded antechamber with lantern mounting system for underwater passage."""

    def __init__(self) -> None:
        """Initialize Submerged Antechamber with lantern brackets and exits."""
        super().__init__(
            name="Submerged Antechamber",
            description=(
                "A partially flooded hall; carved niches hold lantern brackets;"
                " light lines the underwater path."
            ),
            items=[],
            characters=[],
            exits={
                "north": "OuterWards", 
                "east": "SanctumOfTheTide", 
                "west": "TidalCauseway"
            },
        )

    def search(self, game_state: GameState, _target: str = None) -> str:
        """Search the antechamber to examine the lantern mounting system."""
        # If the Tideward sigils haven't been completed, the water remains too
        # deep and obscures the niches — nothing can be revealed by searching.
        if not game_state.get_story_flag(FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED):
            return (
                "[info]The water in the hall sits high and murky. It's impossible to "
                "search effectively here — the flooded approach hides whatever might "
                "lie beneath the surface.[/info]"
            )
        if game_state.get_story_flag(FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT):
            return (
                "[info]The niches glow with steady, pearlescent flame. The Lanterns of the "
                "Deeps are already lit.[/info]"
            )
        # If brackets are not present yet, reveal them for mounting lanterns
        from ..items.LanternBracket import LanternBracket as _LB
        already_here = any(isinstance(i, _LB) for i in self.items)
        if not already_here:
            # Add three brackets to the room for players to mount lanterns on
            self.items.extend([LanternBracket(), LanternBracket(), LanternBracket()])
            return (
                "[event]You wade through chilled water. As you peer into the niches, "
                "three carved brackets become apparent; their grooves catch the "
                "faint tide-light.[/event]"
            )
        return (
            "[info]You wade through chilled water. Three empty brackets line the "
            "approach; their carved grooves catch the faint tide-light.[/info]"
        )

    def mount_lantern(self, game_state: GameState) -> str:
        """Mount a prism lantern on an empty bracket."""
        # Find an empty bracket
        empty = next(
            (
                b for b in self.items
                if isinstance(b, LanternBracket) and not b.has_lantern
            ),
            None
        )
        if empty is None:
            return "[info]All brackets here are already filled.[/info]"
        # Check inventory for a Prism Lantern
        lantern = next(
            (i for i in game_state.inventory if isinstance(i, PrismLantern)), None
        )
        if lantern is None:
            return (
                "[failure]You need a [item_name]Prism Lantern[/item_name] to mount "
                "here.[/failure]"
            )
        # Mount it
        game_state.inventory.remove(lantern)
        empty.has_lantern = True
        return (
            "[event]You seat the prism lantern; water hums softly as the bracket takes its "
            "weight.[/event]"
        )

    def cast_light_here(self, game_state: GameState) -> str:
        """Cast light to illuminate the underwater passage using mounted lanterns."""
        # Light lanterns only if all three brackets have lanterns
        brackets = [b for b in self.items if isinstance(b, LanternBracket)]
        if not brackets or not all(b.has_lantern for b in brackets):
            return (
                "[failure]You kindle a spark, but without all lanterns mounted, the path "
                "won't reveal itself.[/failure]"
            )
        if game_state.get_story_flag(FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT):
            return "[info]The prism lanterns already burn with steady, cold flame.[/info]"
        game_state.set_story_flag(FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT, True)
        return (
            "[success]Light pours from the prisms, weaving a clear path through "
            "the flooded hall. The way to the sanctum stands revealed.[/success]"
        )

    def get_exits(self, game_state: GameState) -> dict[str, str]:
        """Return exits, gating the sanctum entrance on two Act III story flags.

        The east exit leading to the Sanctum of the Tide is only available once
        the Tideward sigils have been completed and the Lanterns of the Deeps
        have been lit.
        """
        exits = dict(self.exits)
        lanterns_lit = game_state.get_story_flag(
            FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT
        )
        sigils_done = game_state.get_story_flag(
            FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED
        )
        if not (lanterns_lit and sigils_done):
            exits.pop("east", None)
        return exits
