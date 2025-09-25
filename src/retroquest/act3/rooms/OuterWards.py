"""Drowned courtyard with tideward sigil pillars."""
from ...engine.GameState import GameState
from ...engine.Room import Room
from ..Act3StoryFlags import FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED
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
    - Sets FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED when quest completed
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
        return (
            "[event]You search the drowned courtyard thoroughly. Apart from the "
            "three ancient warding pillars rising from the black water, there is "
            "little of interest; the pillars alone seem keyed to the moon and tide." 
            "[/event]"
        )
