"""Loyalty Token - proves bonds of trust and resists deception."""

from ...engine.Item import Item
from ...engine.GameState import GameState
from ..Act4StoryFlags import FLAG_ACT4_LOYALTY_TOKEN_ACQUIRED


class LoyaltyToken(Item):
    """A token that proves the bonds of trust with freed allies."""

    def __init__(self) -> None:
        """Initialize the Loyalty Token."""
        super().__init__(
            name="Loyalty Token",
            description=(
                "A small silver medallion bearing the emblem of intertwined hands. "
                "The surface is warm to the touch and emanates a sense of trust and "
                "loyalty. This token represents the bonds formed with those you have "
                "helped, and serves as proof against deception and lies."
            ),
            can_be_carried=True
        )
        self._protection_active = False

    def picked_up(self, game_state: GameState) -> str:
        """Set flag when the token is picked up."""
        game_state.set_story_flag(FLAG_ACT4_LOYALTY_TOKEN_ACQUIRED, True)
        return ""

    def use(self, game_state: GameState) -> str:
        """Use the loyalty token to resist deception."""
        if game_state.current_room.name == "Tower of Shadows":
            if not self._protection_active:
                self._protection_active = True
                return (
                    "[event]You hold the Loyalty Token close to your heart, feeling the "
                    "warmth of true friendship and trust. The token's power forms a "
                    "protective barrier against the lies and deceptions that whisper "
                    "through the shadowy tower.[/event]"
                )
            else:
                return (
                    "[info]The Loyalty Token is already protecting you from deception.[/info]"
                )
        else:
            return (
                "[info]The Loyalty Token glows softly, ready to prove the strength "
                "of your bonds when facing deception.[/info]"
            )