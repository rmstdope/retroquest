from ...engine.Room import Room
from ...engine.GameState import GameState
from ..Act3StoryFlags import FLAG_ACT3_TIDEWARD_SIGILS_ATTUNED
from ..items import CoquinaRunes, WardingPillars


class OuterWards(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Outer Wards",
            description=(
                "Three leaning pillars surround a drowned courtyard; faint glyphs glow when touched with brine."
            ),
            items=[WardingPillars()],
            characters=[],
            exits={"south": "SubmergedAntechamber", "east": "CollapsedPier", "west": "ShorelineMarkers"},
        )

    def search(self, game_state: GameState, target: str = None) -> str:
        if game_state.get_story_flag(FLAG_ACT3_TIDEWARD_SIGILS_ATTUNED):
            return (
                "[info]The pillars hum quietly — the Tideward Sigils remain in gentle resonance, already attuned.[/info]"
            )
        game_state.set_story_flag(FLAG_ACT3_TIDEWARD_SIGILS_ATTUNED, True)
        return (
            "[event]You trace the salt-damp glyphs with wetted fingers. One by one, the Tideward Sigils answer with"
            " a soft chord, knitting the ward's broken cadence.[/event]"
        )

    # Allow casting 'purify' in this room to acknowledge cleansing, even if spells are learned elsewhere
    def light(self, game_state: GameState) -> str:
        # Reuse light hook to return a neutral message if players try 'cast light' here
        return "The faint glyphs flicker but the true work here is in cleansing and setting the sigil."

    # Support sequence: cast purify on pillars, then use coquina runes with pillars
    def cast_purify_on_pillars(self, game_state: GameState) -> str:
        pillars = next((i for i in self.items if isinstance(i, WardingPillars)), None)
        if pillars is None:
            return "[failure]There are no warding pillars here to purify.[/failure]"
        return pillars.purify(game_state)

    def use_runes_with_pillars(self, game_state: GameState) -> str:
        # Require that player has Coquina Runes in inventory
        if not any(isinstance(i, CoquinaRunes) for i in game_state.inventory):
            return (
                "[failure]You need [item_name]Coquina Runes[/item_name] to engrave the Tideward Sigil on these pillars.[/failure]"
            )
        # Set the attuned flag as the outcome of completing the sigil
        game_state.set_story_flag(FLAG_ACT3_TIDEWARD_SIGILS_ATTUNED, True)
        return (
            "[success]You press the coquina rune tiles into cleaned grooves; lines knit into a complete Tideward Sigil."
            " The flood ward steadies—safe passage to the sanctum draws nearer.[/success]"
        )
