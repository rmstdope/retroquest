"""Oath of Stillness quest for Caverns of Shadow (Act 3)."""
from ...engine.GameState import GameState
from ...engine.Quest import Quest
from ..Act3StoryFlags import (
    FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED,
    FLAG_ACT3_OATH_OF_STILLNESS_STARTED
)


class OathOfStillness(Quest):
    """Quiet the wandering phantoms in the Echo Chambers before the dragon's hall."""

    def __init__(self) -> None:
        super().__init__(
            name="Oath of Stillness",
            description=(
                "The Echo Chambers whisper with restless phantoms that block the path to the "
                "dragon's hall. Ancient voices drift through the darkness, their words lost to "
                "time but their purpose clear—they seek the sacred ritual that will grant them "
                "peace. The runic walls hold secrets of old ceremonies, and somewhere within "
                "these carved passages lies the key to silencing their eternal unrest. The echo "
                "stones await a blessed chant, one that must be spoken with reverence and "
                "precision to quiet the wandering spirits."
            ),
            completion=(
                "The Resonant Chant has quieted the wandering phantoms. The illusions have "
                "fallen silent, and the path to the dragon's hall now lies open."
            ),
        )

    def check_trigger(self, game_state: GameState) -> bool:
        """Trigger when Miners' Rescue is completed and player accesses Echo Chambers."""
        return game_state.get_story_flag(FLAG_ACT3_OATH_OF_STILLNESS_STARTED)

    def check_completion(self, game_state: GameState) -> bool:
        """Complete when the oath has been performed and illusions are silenced."""
        return game_state.get_story_flag(FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED)

    def is_main(self) -> bool:
        return False