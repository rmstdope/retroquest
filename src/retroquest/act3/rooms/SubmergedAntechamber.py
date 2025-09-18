from ...engine.Room import Room
from ...engine.GameState import GameState
from ..Act3StoryFlags import FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT


class SubmergedAntechamber(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Submerged Antechamber",
            description=(
                "A partially flooded hall; carved niches hold lantern brackets; light lines the underwater path."
            ),
            items=[],
            characters=[],
            exits={"north": "OuterWards", "east": "SanctumOfTheTide", "west": "TidalCauseway"},
        )

    def search(self, game_state: GameState, target: str = None) -> str:
        if game_state.get_story_flag(FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT):
            return (
                "[info]The niches glow with steady, pearlescent flame. The Lanterns of the Deeps are already lit.[/info]"
            )
        game_state.set_story_flag(FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT, True)
        return (
            "[event]You sweep your hand along the drowned brackets; cold flame blooms within each niche,"
            " guiding light threading the water toward the sanctum.[/event]"
        )
