"""FallenRock item for the Collapsed Galleries rescue sequence."""
from ...engine.Item import Item
from ...engine.GameState import GameState


class FallenRock(Item):
    """A mass of collapsed stone blocking the galleries."""

    def __init__(self) -> None:
        """Initialize FallenRock as an unmovable obstacle."""
        super().__init__(
            name="fallen rock",
            description=(
                "A massive pile of stone and debris blocks the passage, trapping "
                "miners behind tons of rubble."
            ),
            can_be_carried=False
        )

    def use_with(self, game_state: GameState, other_item: "Item") -> str:
        """Handle rescue item usage on the fallen rock."""
        from .ReinforcedBraces import ReinforcedBraces
        from .WedgeBlocks import WedgeBlocks

        if isinstance(other_item, ReinforcedBraces):
            if not game_state.get_story_flag("collapse_stabilized"):
                game_state.set_story_flag("collapse_stabilized", True)
                return (
                    "[event]You wedge the reinforced braces under the sagging "
                    "ceiling, stabilizing the collapse.[/event]"
                )
            return (
                "[info]The braces are already in place, holding the ceiling "
                "steady.[/info]"
            )
        if isinstance(other_item, WedgeBlocks):
            if not game_state.get_story_flag("collapse_stabilized"):
                return (
                    "[info]The collapse is too unstable. Stabilize it with "
                    "braces before using the blocks.[/info]"
                )
            if not game_state.get_story_flag("passage_freed"):
                game_state.set_story_flag("passage_freed", True)
                return (
                    "[event]You hammer the wedge blocks into the cracks, freeing "
                    "the blocked passage.[/event]"
                )
            return (
                "[info]The wedge blocks are already securing the passage.[/info]"
            )
        return "[info]That won't help with the fallen rock.[/info]"
