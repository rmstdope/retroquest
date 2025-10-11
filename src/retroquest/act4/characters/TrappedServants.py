"""Trapped Servants - victims of Malakar's shadow magic awaiting rescue."""

from ...engine.Character import Character
from ...engine.GameState import GameState
from ..Act4StoryFlags import (
    FLAG_ACT4_SERVANTS_TRUST_EARNED,
    FLAG_ACT4_SERVANTS_FREED
)


class TrappedServants(Character):
    """Fortress servants enslaved by dark magic, seeking freedom."""

    def __init__(self) -> None:
        """Initialize the Trapped Servants."""
        super().__init__(
            name="Trapped Servants",
            description=(
                "Several ethereal figures wander in endless circles, their faces "
                "etched with torment. Dark chains of shadow magic bind their spirits "
                "to this cursed ground, forcing them to serve Malakar against their will. "
                "Their eyes plead for release from their eternal suffering."
            )
        )

    def talk(self, game_state: GameState) -> str:
        """Talk to the trapped servants."""
        if not game_state.get_story_flag(FLAG_ACT4_SERVANTS_TRUST_EARNED):
            return (
                "[character_talk]The servants' eyes regard you with fear and suspicion. "
                "One whispers: 'Many have come before... all have fallen to shadow. "
                "Prove your courage against the darkness before we dare trust...'[/character_talk]"
            )
        elif not game_state.get_story_flag(FLAG_ACT4_SERVANTS_FREED):
            return (
                "[character_talk]The servants' faces brighten with hope as they sense "
                "your worthiness. 'You have shown courage! Please, use your compassion "
                "to break these cursed chains that bind us to eternal servitude.'[/character_talk]"
            )
        else:
            return (
                "[character_talk]The freed servants bow gratefully. 'Thank you for our "
                "freedom! The Mirror Labyrinth ahead is treacherous - our pendant will "
                "help guide you, but beware: only the ancient echoes know the full "
                "truth.'[/character_talk]"
            )
