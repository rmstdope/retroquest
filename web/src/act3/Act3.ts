import { Act, type GameState, type Room } from '@/engine'
import { AncientAmulet } from './items/AncientAmulet'
import { DarkPool } from './items/DarkPool'
import { StillwaterPhial } from './items/StillwaterPhial'
import { FortressGates } from './items/FortressGates'
import { LifelightElixir } from './items/LifelightElixir'
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
import {
  FLAG_ACT3_FORTRESS_GATES_EXAMINED,
  FLAG_ACT3_MINERS_RESCUE_COMPLETED,
  FLAG_ACT3_MIRA_CONFESSED,
  FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED,
  FLAG_ACT3_POOLS_STILLED,
} from './Act3StoryFlags'
import { Mira } from './characters/Mira'
import { Tobin } from './characters/Tobin'
import { CEDRIC_DESCRIPTION, CEDRIC_NAME } from './CedricLines'

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
      '[bold]ACT III: TRIALS AND REVELATIONS[/bold]\n\n' +
      'You said it aloud in the castle courtyard, with the vision still ' +
      'fading: [italic]“He took them. That is why they vanished, and that ' +
      'is why he wants me.”[/italic] Sir Cedric did not correct you. ' +
      'Nobody has, and so it has become what you believe: Malakar took ' +
      'your parents, and now he is coming for you.\n\n' +
      'Mira came to Greendale the night of the vision. She had felt the ' +
      'amulet open to the forest, she said, and knew. In the castle ' +
      'courtyard she drew a circle in chalk, and the three of you stepped ' +
      'out of it into her hut in Willowbrook, the herbs still swinging ' +
      'from the beam. She has not yet said how a village healer learned ' +
      'to do that.\n\n' +
      'Now she is the only one who can say what must be done next, and ' +
      'where the road to Malakar begins.\n\n' +
      "Let's begin. (Type 'help' for a list of commands.)\n"
    )
  }

  /** The hook that opens Act III's complete page: the Dragon says the parents are warded away, not dead. */
  override getCompletionHook(): string {
    return (
      "Your parents were Malakar's closest friends. " +
      'The Dragon says they are warded away, not dead.'
    )
  }

  /** Complete Act III once the fortress gates have been examined. */
  override isCompleted(_gameState: GameState): boolean {
    return _gameState.getStoryFlag(FLAG_ACT3_FORTRESS_GATES_EXAMINED)
  }

  /**
   * Sir Cedric walks with Elior: when the party moves to another room he
   * follows, from wherever he stands (a save made before he followed may
   * have left him in Mira's Hut).
   */
  override onRoomChanged(gameState: GameState, _from: Room, to: Room): void {
    for (const room of Object.values(gameState.allRooms)) {
      if (room === to) continue
      const cedric = room.getCharacterByName(CEDRIC_NAME)
      if (!cedric) continue
      cedric.name = CEDRIC_NAME
      room.characters.splice(room.characters.indexOf(cedric), 1)
      to.characters.push(cedric)
    }
  }

  /**
   * Saves from before Sir Cedric was shown in title case still name him in
   * lower case, saves from before the Act III rewrite keep his and Mira's
   * old descriptions (hers until she confesses), saves from before the hut was
   * reworded keep its old description, and saves already past the
   * miners' rescue lack Tobin. Every spell the player knows takes the
   * description of Act III's own copy, so older saves show who taught it.
   */
  override afterLoad(gameState: GameState): void {
    gameState.allRooms.MirasHut.description = new MirasHut().description
    for (const spell of [
      new PurifySpell(),
      new UnlockSpell(),
      new LightSpell(),
      new MendSpell(),
      new BlessSpell(),
    ]) {
      const known = gameState.knownSpells.find((s) => s.id === spell.id)
      if (known) known.description = spell.description
    }
    const galleries = gameState.allRooms.CollapsedGalleries
    if (
      galleries &&
      gameState.getStoryFlag(FLAG_ACT3_MINERS_RESCUE_COMPLETED) &&
      !galleries.getCharacterByName('tobin')
    ) {
      galleries.addCharacter(new Tobin())
    }
    for (const room of Object.values(gameState.allRooms)) {
      const cedric = room.getCharacterByName(CEDRIC_NAME)
      if (!cedric) continue
      cedric.name = CEDRIC_NAME
      cedric.description = CEDRIC_DESCRIPTION
    }
    if (!gameState.getStoryFlag(FLAG_ACT3_MIRA_CONFESSED)) {
      for (const room of Object.values(gameState.allRooms))
        for (const character of room.characters)
          if (character instanceof Mira)
            character.description = Mira.DESCRIPTION
    }
    this.patchStillnessVestibule(gameState)
    this.patchFortressThreshold(gameState)
  }

  /**
   * Saves from before the fortress threshold was reworded keep the old
   * descriptions of the entrance, its gates and the lifelight elixir.
   */
  private patchFortressThreshold(gameState: GameState): void {
    const entrance = gameState.allRooms.FortressEntrance
    if (entrance) entrance.description = new FortressEntrance().description
    const items = [
      ...gameState.inventory,
      ...Object.values(gameState.allRooms).flatMap((room) => room.items),
    ]
    for (const item of items) {
      if (item instanceof FortressGates)
        item.description = new FortressGates().description
      if (item instanceof LifelightElixir)
        item.description = new LifelightElixir().description
    }
  }

  /**
   * Saves from before the Stillwater Phial stilled the pools keep the old
   * phial text and have no pool; a save past the oath counts as stilled.
   */
  private patchStillnessVestibule(gameState: GameState): void {
    const phialText = new StillwaterPhial().description
    const items = [
      ...gameState.inventory,
      ...Object.values(gameState.allRooms).flatMap((room) => room.items),
    ]
    for (const item of items) {
      if (item instanceof StillwaterPhial) item.description = phialText
    }
    const vestibule = gameState.allRooms.StillnessVestibule
    if (
      vestibule &&
      !vestibule.items.some((item) => item instanceof DarkPool)
    ) {
      vestibule.addItem(new DarkPool())
    }
    if (gameState.getStoryFlag(FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED)) {
      gameState.setStoryFlag(FLAG_ACT3_POOLS_STILLED, true)
    }
  }

  /** Give Elior his amulet and ensure essential Act III magic is available at start. */
  override setupGameState(gameState: GameState): void {
    // Mira gave Elior the amulet at the end of Act I
    gameState.addItemToInventory(new AncientAmulet())
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
