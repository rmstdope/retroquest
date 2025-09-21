"""Crystal of Light item for Act III."""

from ...engine.GameState import GameState
from ...engine.Item import Item
from ..Act3StoryFlags import (
    FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED,
    FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT,
    FLAG_ACT3_TIDEWARD_SIGILS_ATTUNED,
    FLAG_ACT3_VOW_OF_COURAGE_MADE,
)


class CrystalOfLight(Item):
    """Central luminous relic binding multiple quest prerequisites (Act III).

    Narrative Role:
        Acts as a synthesis reward once sigils are attuned, deep lanterns lit, and a 
        courage vow made.

    Key Mechanics:
        Pickup reversal enforces completion gating; upon success sets acquisition flag.
    """

    def __init__(self) -> None:
        super().__init__(
            name="crystal of light",
            short_name="crystal",
            description=(
                "A palm-sized prism humming with soft radiance. Within it swirl echoes "
                "of moonlit tides and layered ward patterns waiting to converge."
            ),
            can_be_carried=True,
        )

    def examine(self, _game_state: GameState) -> str:  # noqa: ARG002
        """Return descriptive examination text referencing ambient progress cues."""
        return (
            "[event]The crystal's facets amplify the faintest glow, casting sigil-like "
            "refractions. It seems to breathe with the tide.[/event]"
        )

    def prevent_pickup(self) -> str | None:  # noqa: D401
        """No direct blocking; gating enforced during `picked_up()`."""
        return None

    def picked_up(self, game_state: GameState) -> str | None:
        """Handle gated acquisition, reversing pickup if prerequisites unmet."""
        sigils = game_state.get_story_flag(FLAG_ACT3_TIDEWARD_SIGILS_ATTUNED)
        lanterns = game_state.get_story_flag(FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT)
        vow = game_state.get_story_flag(FLAG_ACT3_VOW_OF_COURAGE_MADE)
        if not (sigils and lanterns and vow):
            game_state.remove_item_from_inventory(self.get_name(), 1)
            game_state.current_room.add_item(self)
            return (
                "[failure]Wards flare as you touch the crystal, locking it in place. "
                "Complete the rites: attune Tideward Sigils, light the Lanterns of the "
                "Deeps, and swear the vow before it will yield.[/failure]"
            )
        if not game_state.get_story_flag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED):
            game_state.set_story_flag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED, True)
        return (
            "[item_effect]The crystal steadies in your grasp, radiance aligning with your "
            "resolve.[/item_effect]"
        )
