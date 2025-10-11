"""Guardian's Chain - protective charm against shadow magic."""

from ...engine.Item import Item
from ...engine.GameState import GameState
from ..Act4StoryFlags import FLAG_ACT4_GUARDIANS_CHAIN_ACQUIRED


class GuardiansChain(Item):
    """A mystical chain that provides protection against dark magic."""

    def __init__(self) -> None:
        """Initialize the Guardian's Chain."""
        super().__init__(
            name="Guardian's Chain",
            description=(
                "A silver chain adorned with small crystal pendants that shimmer with "
                "protective light. Each link is inscribed with ancient protective runes "
                "that ward against shadow magic. The chain feels warm to the touch and "
                "pulses gently with defensive energy."
            ),
            can_be_carried=True
        )
        self._protection_active = False

    def picked_up(self, game_state: GameState) -> str:
        """Set flag when the chain is picked up."""
        game_state.set_story_flag(FLAG_ACT4_GUARDIANS_CHAIN_ACQUIRED, True)
        return (
            "[event]As you lift the Guardian's Chain, you feel a surge of protective "
            "energy coursing through your body. The chain's light grows brighter, "
            "recognizing you as its new bearer.[/event]"
        )

    def use(self, game_state: GameState) -> str:
        """Activate the chain's protective properties."""
        if game_state.current_room.name == "Hall of Echoes":
            if not self._protection_active:
                self._protection_active = True
                return (
                    "[event]You hold the Guardian's Chain aloft, and its crystals blaze "
                    "with brilliant light. A protective barrier forms around you, "
                    "shielding you from the despair that emanates from the corrupted "
                    "knight.[/event]"
                )
            else:
                return (
                    "[info]The Guardian's Chain is already providing its protection.[/info]"
                )
        else:
            return (
                "[info]The Guardian's Chain glows softly, ready to protect you when "
                "facing shadow magic.[/info]"
            )
