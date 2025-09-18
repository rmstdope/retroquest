from ...engine.Item import Item
from ...engine.GameState import GameState
from ..Act3StoryFlags import (
    FLAG_ACT3_TIDEWARD_SIGILS_ATTUNED,
    FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT,
    FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED,
)


class CrystalOfLight(Item):
    def __init__(self) -> None:
        super().__init__(
            name="crystal of light",
            short_name="crystal",
            description=(
                "A palm-sized prism humming with soft radiance; within it swirl echoes of moonlit tides and ancient wards."
            ),
            can_be_carried=True,
        )

    def examine(self, game_state: GameState) -> str:
        return (
            "[event]You study the [item_name]Crystal of Light[/item_name]. Its facets catch even the faintest glow,"
            " throwing sigil-like refractions across the chamber. It feels attuned to the tide's breath.[/event]"
        )

    def prevent_pickup(self) -> str | None:
        # Enforce local side-quest gating: sigils attuned and lanterns lit
        # Note: We require both flags set before the crystal can be taken.
        return None  # Default; gate will be checked during picked_up where we have game_state context

    def picked_up(self, game_state: GameState) -> str | None:
        sigils = game_state.get_story_flag(FLAG_ACT3_TIDEWARD_SIGILS_ATTUNED)
        lanterns = game_state.get_story_flag(FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT)
        if not (sigils and lanterns):
            # Prevent acquisition by reversing and informing the player
            game_state.remove_item_from_inventory(self.get_name(), 1)
            game_state.current_room.add_item(self)
            return (
                "[failure]As your fingers close around the Crystal, the chamber's wards flare."
                " Unbalanced rites resist your claim. The Tideward Sigils must be attuned and the Lanterns of the"
                " Deeps lit before the relic will yield.[/failure]"
            )

        # Mark acquisition and provide a short effect line
        if not game_state.get_story_flag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED):
            game_state.set_story_flag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED, True)
        return (
            "[item_effect]The Crystal settles in your grasp, its radiance steadying — courage answered by the sea's consent.[/item_effect]"
        )
