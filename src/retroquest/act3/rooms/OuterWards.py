"""Drowned courtyard with tideward sigil pillars."""
from ...engine.GameState import GameState
from ...engine.Room import Room
from ..Act3StoryFlags import FLAG_ACT3_TIDEWARD_SIGILS_ATTUNED
from ..items import WardingPillars


class OuterWards(Room):
    """
    A flooded courtyard with three ancient pillars for tideward sigil work.

    Narrative Role:
    - Central location for the Tideward Sigils side quest
    - Demonstrates the connection between purification magic and sigil crafting
    - Gateway area that controls access to deeper sanctum areas

    Key Mechanics:
    - Search action attunes sigils when first performed
    - Supports purify spell casting on pillars via room hook
    - Enables moon rune shard + pillar combination for sigil completion
    - Sets FLAG_ACT3_TIDEWARD_SIGILS_ATTUNED when quest completed
    """
    def __init__(self) -> None:
        """Initialize Outer Wards with warding pillars and exits."""
        super().__init__(
            name="Outer Wards",
            description=(
                "The courtyard lies half-swallowed by the sea. Three ancient pillars "
                "rise from the black water, their faces scored with shallow marks. "
                "Brine beads along the carved lines and they catch the moon in small "
                "rings of light. The air here tastes of old promises and slow tides."
            ),
            items=[WardingPillars()],
            characters=[],
            exits={
                "south": "SubmergedAntechamber",
                "east": "CollapsedPier",
                "west": "ShorelineMarkers"
            },
        )

    def search(self, game_state: GameState, _target: str = None) -> str:
        """Override search to handle tideward sigil attunement on first use."""
        if game_state.get_story_flag(FLAG_ACT3_TIDEWARD_SIGILS_ATTUNED):
            return (
                "[info]The pillars hum quietly — the Tideward Sigils remain in gentle "
                "resonance, already attuned.[/info]"
            )
        game_state.set_story_flag(FLAG_ACT3_TIDEWARD_SIGILS_ATTUNED, True)
        return (
            "[event]You trace the salt-damp glyphs with wetted fingers. One by one, the "
            "Tideward Sigils answer with a soft chord, knitting the ward's broken "
            "cadence.[/event]"
        )

    # Allow casting 'purify' in this room to acknowledge cleansing, even if spells are
    # learned elsewhere
    def light(self, _game_state: GameState) -> str:
        """Override light spell to provide context-appropriate guidance."""
        # Reuse light hook to return a neutral message if players try 'cast light' here
        return (
            "The faint glyphs flicker but the true work here is in cleansing and setting "
            "the sigil."
        )

    # Support sequence: cast purify on pillars, then use moon rune shards with pillars
    def cast_purify_on_pillars(self, _game_state: GameState) -> str:
        """Handle purify spell targeting on warding pillars."""
        pillars = next((i for i in self.items if isinstance(i, WardingPillars)), None)
        if pillars is None:
            return "[failure]There are no warding pillars here to purify.[/failure]"
        return pillars.purify(_game_state)
