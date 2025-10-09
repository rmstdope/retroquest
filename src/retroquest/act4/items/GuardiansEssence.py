"""Guardian's Essence - proof of courage that enables selfless acts."""

from ...engine.Item import Item
from ...engine.GameState import GameState
from ..Act4StoryFlags import FLAG_ACT4_GUARDIANS_ESSENCE_ACQUIRED, FLAG_ACT4_SERVANTS_TRUST_EARNED


class GuardiansEssence(Item):
    """The distilled essence of a guardian's courage, enabling acts of selflessness."""

    def __init__(self) -> None:
        """Initialize the Guardian's Essence."""
        super().__init__(
            name="Guardian's Essence",
            description=(
                "A swirling orb of golden light that contains the purified essence of "
                "a guardian's courage. The light within shifts and dances, radiating "
                "warmth and determination. This essence proves your worthiness to those "
                "who have suffered under shadow magic."
            ),
            can_be_carried=True
        )

    def picked_up(self, game_state: GameState) -> str:
        """Set flag when the essence is acquired."""
        game_state.set_story_flag(FLAG_ACT4_GUARDIANS_ESSENCE_ACQUIRED, True)
        return ""

    def use_on_character(self, game_state: GameState, target_character) -> str:
        """Use Guardian's Essence on servants to prove worthiness."""
        if (hasattr(target_character, 'name') and 
            'servant' in target_character.name.lower() and
            game_state.current_room.name == "Outer Courtyard"):
            if not game_state.get_story_flag(FLAG_ACT4_SERVANTS_TRUST_EARNED):
                game_state.set_story_flag(FLAG_ACT4_SERVANTS_TRUST_EARNED, True)
                return (
                    "[event]You present the Guardian's Essence to the trapped servants. "
                    "The golden light recognizes their suffering and your courage in "
                    "facing the shadow guardians. The servants' eyes brighten with hope "
                    "as they sense your worthiness to help them.[/event]"
                )
            else:
                return (
                    "[info]The servants already recognize your worthiness.[/info]"
                )
        return super().use_on_character(game_state, target_character)

    def use(self, game_state: GameState) -> str:
        """Use Guardian's Essence to prove worthiness."""
        if game_state.current_room.name == "Outer Courtyard":
            return (
                "[info]The Guardian's Essence glows brightly, ready to prove your "
                "worthiness to those who need your help. Try using it on the servants.[/info]"
            )
        elif game_state.current_room.name == "Hall of Echoes":
            return (
                "[info]The Guardian's Essence resonates with the ancient hall, "
                "recognizing the nobility that once existed here.[/info]"
            )
        else:
            return (
                "[info]The Guardian's Essence pulses gently, waiting for the right "
                "moment to demonstrate your courage.[/info]"
            )