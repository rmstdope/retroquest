"""Miners character for the Collapsed Galleries rescue sequence."""
from ...engine.Character import Character
from ...engine.GameState import GameState
from ..Act3StoryFlags import FLAG_ACT3_MINERS_RESCUE_COMPLETED


class Miners(Character):
    """Trapped miners awaiting rescue in the collapsed galleries."""

    def __init__(self) -> None:
        """Initialize the Miners character."""
        super().__init__(
            name="miners",
            description=(
                "A group of miners trapped behind the fallen rock, their voices "
                "echoing faintly through the debris."
            )
        )

    def talk_to(self, game_state: GameState) -> str:
        """Handle talking to the miners for rescue completion."""
        if (
            game_state.get_story_flag("collapse_stabilized")
            and game_state.get_story_flag("passage_freed")
            and not game_state.get_story_flag(FLAG_ACT3_MINERS_RESCUE_COMPLETED)
        ):
            game_state.set_story_flag(FLAG_ACT3_MINERS_RESCUE_COMPLETED, True)
            return (
                "[event]You lead the miners through the newly opened passage to "
                "safety. The route to the Echo Chambers is now open![/event]"
            )
        return (
            "[dialogue]The miners call out, 'We're still trapped! Please, clear "
            "the way!'[/dialogue]"
        )
