import { Act, type GameState } from '@/engine'
import { MirasHut } from './rooms/MirasHut'
import { TidalCauseway } from './rooms/TidalCauseway'
import { ShorelineMarkers } from './rooms/ShorelineMarkers'
import { OuterWards } from './rooms/OuterWards'
import { CollapsedPier } from './rooms/CollapsedPier'
import { SubmergedAntechamber } from './rooms/SubmergedAntechamber'
import { SanctumOfTheTide } from './rooms/SanctumOfTheTide'
import { LowerSwitchbacks } from './rooms/LowerSwitchbacks'
import { ObsidianOutcrops } from './rooms/ObsidianOutcrops'
import { MirrorTerraces } from './rooms/MirrorTerraces'
import { FumarolePassages } from './rooms/FumarolePassages'
import { EmberGallery } from './rooms/EmberGallery'
import { PhoenixCrater } from './rooms/PhoenixCrater'
import { CavernMouth } from './rooms/CavernMouth'
import { ToolCache } from './rooms/ToolCache'
import { CollapsedGalleries } from './rooms/CollapsedGalleries'
import { EchoChambers } from './rooms/EchoChambers'
import { StillnessVestibule } from './rooms/StillnessVestibule'
import { DragonsHall } from './rooms/DragonsHall'
import { FortressEntrance } from './rooms/FortressEntrance'
import { TheThreeVirtuesQuest } from './quests/TheThreeVirtues'
import { EchoesOfTheHiddenBondQuest } from './quests/EchoesOfTheHiddenBond'
import { TidewardSigilsQuest } from './quests/TidewardSigils'
import { LanternsOfTheDeepsQuest } from './quests/LanternsOfTheDeeps'
import { MirrorsOfEmberlightQuest } from './quests/MirrorsOfEmberlight'
import { BreathOfTheMountain } from './quests/BreathOfTheMountain'
import { MinersRescue } from './quests/MinersRescue'
import { OathOfStillness } from './quests/OathOfStillness'
import { LightSpell } from './spells/LightSpell'
import { PurifySpell } from './spells/PurifySpell'
import { UnlockSpell } from './spells/UnlockSpell'
import { MendSpell } from './spells/MendSpell'
import { BlessSpell } from './spells/BlessSpell'
import { ACT3_CLASSES } from './classes'
import { ACT3_GOLDEN_PATH } from './Act3GoldenPath'
import { FLAG_ACT3_FORTRESS_GATES_EXAMINED } from './Act3StoryFlags'

/** Act 3 of RetroQuest: The Awakening. */
export class Act3 extends Act {
  constructor() {
    const rooms = {
      // Starting hub
      MirasHut: new MirasHut(),

      // Sunken Ruins
      TidalCauseway: new TidalCauseway(),
      ShorelineMarkers: new ShorelineMarkers(),
      OuterWards: new OuterWards(),
      CollapsedPier: new CollapsedPier(),
      SubmergedAntechamber: new SubmergedAntechamber(),
      SanctumOfTheTide: new SanctumOfTheTide(),

      // Mount Ember
      LowerSwitchbacks: new LowerSwitchbacks(),
      ObsidianOutcrops: new ObsidianOutcrops(),
      MirrorTerraces: new MirrorTerraces(),
      FumarolePassages: new FumarolePassages(),
      EmberGallery: new EmberGallery(),
      PhoenixCrater: new PhoenixCrater(),

      // Caverns of Shadow
      CavernMouth: new CavernMouth(),
      ToolCache: new ToolCache(),
      CollapsedGalleries: new CollapsedGalleries(),
      EchoChambers: new EchoChambers(),
      StillnessVestibule: new StillnessVestibule(),
      DragonsHall: new DragonsHall(),

      // Ending
      FortressEntrance: new FortressEntrance(),
    }

    const quests = [
      // Main Quest
      new TheThreeVirtuesQuest(),
      // Storytelling Quest
      new EchoesOfTheHiddenBondQuest(),
      // Sunken Ruins Side Quests
      new TidewardSigilsQuest(),
      new LanternsOfTheDeepsQuest(),
      // Mount Ember Side Quests
      new MirrorsOfEmberlightQuest(),
      new BreathOfTheMountain(),
      // Caverns of Shadow Side Quests
      new MinersRescue(),
      new OathOfStillness(),
    ]

    super({
      name: 'Act3',
      rooms,
      quests,
      musicFile: 'Orchestronika - Feel The Storm (freetouse.com).mp3',
      musicInfo:
        'Music track: Feel The Storm by Orchestronika\n' +
        'Source: https://freetouse.com/music\n' +
        'No Copyright Vlog Music for Videos',
      classes: ACT3_CLASSES,
      goldenPath: ACT3_GOLDEN_PATH,
    })
  }

  /** Return the introductory text for Act III. */
  override getActIntro(): string {
    return (
      '[bold]ACT III: THE AWAKENING[/bold]\n\n' +
      'You and Sir Cedric return to Willowbrook, the village where it all began. ' +
      'Mira is waiting — the only one who can reveal how to confront Malakar ' +
      'and what must be done next. ' +
      'Her guidance will chart your path toward the Obsidian Fortress ' +
      'and the trials ahead.\n\n' +
      'Gather your resolve; the final hunt begins where the first questions ' +
      'were asked.\n\n' +
      "Let's begin. (Type 'help' for a list of commands.)\n"
    )
  }

  /** Complete Act III once the fortress gates have been examined. */
  override isCompleted(_gameState: GameState): boolean {
    return _gameState.getStoryFlag(FLAG_ACT3_FORTRESS_GATES_EXAMINED)
  }

  /** Ensure essential Act III magic is available at start. */
  override setupGameState(gameState: GameState): void {
    // Learn core Act III spells so Sunken Ruins progression is possible
    if (!gameState.hasSpell(new PurifySpell().id)) {
      gameState.learnSpell(new PurifySpell())
    }
    if (!gameState.hasSpell(new UnlockSpell().id)) {
      gameState.learnSpell(new UnlockSpell())
    }
    if (!gameState.hasSpell(new LightSpell().id)) {
      gameState.learnSpell(new LightSpell())
    }
    if (!gameState.hasSpell(new MendSpell().id)) {
      gameState.learnSpell(new MendSpell())
    }
    if (!gameState.hasSpell(new BlessSpell().id)) {
      gameState.learnSpell(new BlessSpell())
    }
  }
}
