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

    def talk_to(self, game_state: GameState) -> str:
        """Return the servants' plea, which changes as their trust and freedom are won."""
        name = f"[character_name]{self.get_name()}[/character_name]"
        if not game_state.get_story_flag(FLAG_ACT4_SERVANTS_TRUST_EARNED):
            return (
                f"The eyes of the {name} regard you with fear and suspicion. "
                "One whispers: [dialogue]'Many have come before... all have fallen to "
                "shadow. Prove your courage against the darkness before we dare "
                "trust...'[/dialogue]"
            )
        if not game_state.get_story_flag(FLAG_ACT4_SERVANTS_FREED):
            return (
                f"The faces of the {name} brighten with hope as they sense your "
                "worthiness. [dialogue]'You have shown courage! Please, use your "
                "compassion to break these cursed chains that bind us to eternal "
                "servitude.'[/dialogue]"
            )
        return (
            f"The freed {name} bow gratefully. [dialogue]'Thank you for our freedom! "
            "The Mirror Labyrinth ahead is treacherous - our pendant will help guide "
            "you, but beware: only the ancient echoes know the full truth.'[/dialogue]"
        )
