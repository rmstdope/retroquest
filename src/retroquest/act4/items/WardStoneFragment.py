"""Ward Stone Fragment - magical component for bypassing fortress defenses."""

from ...engine.Item import Item
from ...engine.GameState import GameState
from ..Act4StoryFlags import FLAG_ACT4_BARRIERS_DISABLED


class WardStoneFragment(Item):
    """A fragment of a ward stone that can disable magical barriers."""

    def __init__(self) -> None:
        """Initialize the Ward Stone Fragment."""
        super().__init__(
            name="Ward Stone Fragment",
            description=(
                "A jagged piece of dark stone that pulses with residual magical energy. "
                "Ancient runes are carved into its surface, glowing faintly with purple light. "
                "This fragment appears to be a key component of the fortress's defensive wards."
            ),
            can_be_carried=True
        )

    def use(self, game_state: GameState) -> str:
        """Use the ward stone fragment to disable barriers."""
        if game_state.current_room.name == "Fortress Gates":
            # Check if barriers are still active
            if not game_state.get_story_flag(FLAG_ACT4_BARRIERS_DISABLED):
                game_state.set_story_flag(FLAG_ACT4_BARRIERS_DISABLED, True)
                return (
                    "[event]You press the ward stone fragment against the magical barriers. "
                    "The purple energy flickers and fades as the defensive wards are disrupted. "
                    "The barriers collapse with a resonant hum, clearing the way forward.[/event]"
                )
            else:
                return (
                    "[failure]The barriers have already been disabled. The ward stone "
                    "fragment has served its purpose.[/failure]"
                )
        else:
            return (
                "[failure]The ward stone fragment only responds to the specific magical "
                "barriers of the fortress gates.[/failure]"
            )

    def use_with(self, game_state: GameState, other_item) -> str:
        """Use ward stone fragment with barriers specifically."""
        if (hasattr(other_item, 'name') and 
            'barrier' in other_item.name.lower() and 
            game_state.current_room.name == "Fortress Gates"):
            return self.use(game_state)
        return super().use_with(game_state, other_item)