from retroquest.engine.Act import Act
from retroquest.engine.GameState import GameState
from .spells import PurifySpell
from .Act3StoryFlags import FLAG_ACT3_COMPLETED
from .quests import TheThreeVirtuesQuest, TidewardSigilsQuest
from .rooms import (
    MirasHut,
    TidalCauseway, ShorelineMarkers, OuterWards, CollapsedPier, SubmergedAntechamber, SanctumOfTheTide,
    LowerSwitchbacks, ObsidianOutcrops, MirrorTerraces, FumarolePassages, EmberGallery, PhoenixCrater,
    CavernMouth, ToolCache, CollapsedGalleries, EchoChambers, StillnessVestibule, DragonsHall,
    FortressEntrance,
)

class Act3(Act):
    """Act 3 of RetroQuest: The Awakening."""
    
    def __init__(self) -> None:
        """Initialize Act 3 with all rooms and quests."""
        rooms = {
            # Starting hub
            "MirasHut": MirasHut(),

            # Sunken Ruins
            "TidalCauseway": TidalCauseway(),
            "ShorelineMarkers": ShorelineMarkers(),
            "OuterWards": OuterWards(),
            "CollapsedPier": CollapsedPier(),
            "SubmergedAntechamber": SubmergedAntechamber(),
            "SanctumOfTheTide": SanctumOfTheTide(),

            # Mount Ember
            "LowerSwitchbacks": LowerSwitchbacks(),
            "ObsidianOutcrops": ObsidianOutcrops(),
            "MirrorTerraces": MirrorTerraces(),
            "FumarolePassages": FumarolePassages(),
            "EmberGallery": EmberGallery(),
            "PhoenixCrater": PhoenixCrater(),

            # Caverns of Shadow
            "CavernMouth": CavernMouth(),
            "ToolCache": ToolCache(),
            "CollapsedGalleries": CollapsedGalleries(),
            "EchoChambers": EchoChambers(),
            "StillnessVestibule": StillnessVestibule(),
            "DragonsHall": DragonsHall(),

            # Ending
            "FortressEntrance": FortressEntrance(),
        }
        
        quests = [
            # Main Quest
            TheThreeVirtuesQuest(),
            # Sunken Ruins Side Quests
            TidewardSigilsQuest(),
        ]

        music_file = "Orchestronika - Feel The Storm (freetouse.com).mp3"
        music_info = 'Music track: Feel The Storm by Orchestronika\nSource: https://freetouse.com/music\nNo Copyright Vlog Music for Videos'
        super().__init__('Act III', rooms, quests, music_file=music_file, music_info=music_info)

    def get_act_intro(self) -> str:
        return (
            "[bold]ACT III: THE AWAKENING[/bold]\n\n"
            "You and Sir Cedric return to Willowbrook, the village where it all began. "
            "Mira is waiting — the only one who can reveal how to confront Malakar and what must be done next. "
            "Her guidance will chart your path toward the Obsidian Fortress and the trials ahead.\n\n"
            "Gather your resolve; the final hunt begins where the first questions were asked.\n\n"
            "Let's begin. (Type 'help' for a list of commands.)\n"
        )

    def is_completed(self, game_state: GameState) -> bool:
        # Act III completes when the fortress gate is opened and the endgame is triggered.
        return game_state.get_story_flag(FLAG_ACT3_COMPLETED)

    def setup_gamestate(self, game_state: GameState) -> None:
        """Ensure essential Act III magic is available at start."""
        # Learn Purify so the player can cleanse and interact with Sunken Ruins wards
        game_state.learn_spell(PurifySpell())
