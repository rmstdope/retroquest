"""Flooded antechamber with lantern mounting system for underwater passage."""
from ...engine.GameState import GameState
from ...engine.Room import Room
from ..Act3StoryFlags import FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT
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
            items=[LanternBracket(), LanternBracket(), LanternBracket()],
            characters=[],
            exits={
                "north": "OuterWards", 
                "east": "SanctumOfTheTide", 
                "west": "TidalCauseway"
            },
        )

    def search(self, game_state: GameState, _target: str = None) -> str:
        """Search the antechamber to examine the lantern mounting system."""
        if game_state.get_story_flag(FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT):
            return (
                "[info]The niches glow with steady, pearlescent flame. The Lanterns of the "
                "Deeps are already lit.[/info]"
            )
        return (
            "[event]You wade through chilled water. Three empty brackets line the "
            "approach, awaiting lanterns. Set them, then kindle the way "
            "forward.[/event]"
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
