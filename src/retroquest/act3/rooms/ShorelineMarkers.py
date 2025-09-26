"""Shoreline Markers room for Act 3."""

from ...engine.GameState import GameState
from ...engine.Room import Room
from ..items import MoonRuneShards, Steles
from ..Act3StoryFlags import FLAG_ACT3_TIDEWARD_SIGILS_STARTED


class ShorelineMarkers(Room):
    """Shore location with weathered steles containing moon rune shards."""

    def __init__(self) -> None:
        """Initialize Shoreline Markers with steles and exits."""
        super().__init__(
            name="Shoreline Markers",
            description=(
                "The shore here is quiet and cold. Weathered steles rise from the sand, "
                "their worn faces full of shallow marks. Salt and time have smudged "
                "many lines, but faint moon sigils still show when the tide drops. "
                "Loose pale flakes sit in the grooves; they shimmer like old stars. "
                "When the moon is high, the stones seem to hum with a slow, patient "
                "voice—an old magic tied to the sea."
            ),
            items=[Steles()],
            characters=[],
            exits={"south": "TidalCauseway", "east": "OuterWards"},
        )


    def search(self, game_state: GameState, _target: str = None) -> str:
        """Search the steles to find Moon Rune shards for ward construction."""
        # If runes already present either in room or inventory, return idempotent message
        already_here = any(isinstance(i, MoonRuneShards) for i in self.items)
        already_owned = any(isinstance(i, MoonRuneShards) for i in game_state.inventory)
        if already_here or already_owned:
            return (
                "[event]You comb the surf-slick stones again. pale shards gleam in "
                "the cracks, but you've already gathered what you need.[/event]"
            )
        # Reveal runes
        self.items.append(MoonRuneShards())
        # Mark that the Tideward Sigils side quest has been started by reaching
        # the shoreline markers. This flag is used to trigger the quest in the
        # quest system.
        if not game_state.get_story_flag(FLAG_ACT3_TIDEWARD_SIGILS_STARTED):
            game_state.set_story_flag(FLAG_ACT3_TIDEWARD_SIGILS_STARTED, True)
        return (
            "[event]You brush aside kelp and barnacle crusts. A cluster of pale moon "
            "shards comes free—etched with curved lines that seem to hum when the "
            "moon leans toward the sea. They feel keyed to the tide, as if the "
            "lunar pull listens to these marks.[/event]"
        )
