"""Servant's Pendant - provides guidance through maze navigation."""

from ...engine.Item import Item
from ...engine.GameState import GameState
from ..Act4StoryFlags import FLAG_ACT4_SERVANTS_PENDANT_ACQUIRED


class ServantsPendant(Item):
    """A pendant that allows communication with freed servants for guidance."""

    def __init__(self) -> None:
        """Initialize the Servant's Pendant."""
        super().__init__(
            name="Servant's Pendant",
            description=(
                "A delicate crystal pendant suspended on a fine chain. The crystal "
                "pulses with a gentle blue light and contains the grateful essence "
                "of the freed servants. Through this pendant, their knowledge and "
                "guidance can assist you in navigating treacherous paths."
            ),
            can_be_carried=True
        )
        self._guidance_received = False

    def picked_up(self, game_state: GameState) -> str:
        """Set flag when the pendant is picked up."""
        game_state.set_story_flag(FLAG_ACT4_SERVANTS_PENDANT_ACQUIRED, True)
        return ""

    def use(self, game_state: GameState) -> str:
        """Use the pendant to receive guidance from freed servants."""
        if game_state.current_room.name == "Mirror Labyrinth":
            if not self._guidance_received:
                self._guidance_received = True
                return (
                    "[event]You hold the Servant's Pendant and feel a warm connection "
                    "to the freed servants. Their voices whisper guidance through the "
                    "crystal: 'The mirrors show many paths, but only echoes from the "
                    "ancient halls reveal the true way forward.'[/event]"
                )
            else:
                return (
                    "[info]The servants have already shared their guidance about the "
                    "mirror labyrinth.[/info]"
                )
        else:
            return (
                "[info]The Servant's Pendant glows softly, ready to provide guidance "
                "when you need their knowledge.[/info]"
            )
