"""Act 4 of RetroQuest: The Awakening."""

from retroquest.engine.Act import Act
from retroquest.engine.GameState import GameState

from .rooms import (
    FortressGates,
    OuterCourtyard,
    MirrorLabyrinth,
    HallOfEchoes,
    TowerOfShadows,
    ChamberOfWhispers,
    MemoryVault,
    ThroneChamberApproach,
    ThroneChamer,
    RoyalGardens,
)


class Act4(Act):
    """Act 4 of RetroQuest: The Awakening."""

    def __init__(self) -> None:
        """Initialize Act 4 with all rooms and quests."""
        rooms = {
            # Fortress entrance
            "FortressGates": FortressGates(),
            "OuterCourtyard": OuterCourtyard(),
            
            # Inner fortress
            "MirrorLabyrinth": MirrorLabyrinth(),
            "HallOfEchoes": HallOfEchoes(),
            "TowerOfShadows": TowerOfShadows(),
            "ChamberOfWhispers": ChamberOfWhispers(),
            "MemoryVault": MemoryVault(),
            
            # Final areas
            "ThroneChamberApproach": ThroneChamberApproach(),
            "ThroneChamer": ThroneChamer(),
            "RoyalGardens": RoyalGardens(),
        }

        quests = [
            # Quests will be added when implemented
        ]

        music_file = "Conquest - The Silver Grail (freetouse.com).mp3"
        music_info = (
            'Music track: The Silver Grail by Conquest\n'
            'Source: https://freetouse.com/music\n'
            'Music for Videos (Free Download)\n'
        )
        super().__init__(
            'Act IV', rooms, quests, music_file=music_file, music_info=music_info
        )

    def get_act_intro(self) -> str:
        """Return the introductory text for Act IV."""
        return (
            "[bold]ACT IV: THE FINAL CONFRONTATION[/bold]\n\n"
            "With the Lifelight Elixir in hand, you stand before Malakar's fortress. "
            "The obsidian gates loom ahead, wreathed in shadow and ancient magic. "
            "This is the culmination of your journey—a test of courage, wisdom, and "
            "selflessness that will determine the fate of the kingdom.\n\n"
            "The final confrontation awaits. Every choice you make will echo through "
            "eternity.\n\n"
            "Let's begin. (Type 'help' for a list of commands.)\n"
        )

    def is_completed(self, _game_state: GameState) -> bool:
        """Check if Act IV is completed."""
        # Completion check will be implemented when quests are added
        return False

    def setup_gamestate(self, _game_state: GameState) -> None:
        """Setup initial state for Act IV."""
        # Spell and item setup will be added when quests are implemented
