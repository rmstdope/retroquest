import { Act, characterName, type GameState, type Item, speech } from '@/engine'
import { Brenn } from './characters/Brenn'
import { AncientAmulet } from './items/AncientAmulet'
import { MountainPath } from './rooms/MountainPath'
import { GreendaleGates } from './rooms/GreendaleGates'
import { MainSquare } from './rooms/MainSquare'
import { MarketDistrict } from './rooms/MarketDistrict'
import { SilverStagInn } from './rooms/SilverStagInn'
import { InnRooms } from './rooms/InnRooms'
import { MerchantsWarehouse } from './rooms/MerchantsWarehouse'
import { CastleApproach } from './rooms/CastleApproach'
import { CastleCourtyard } from './rooms/CastleCourtyard'
import { GreatHall } from './rooms/GreatHall'
import { ResidentialQuarter } from './rooms/ResidentialQuarter'
import { HealersHouse } from './rooms/HealersHouse'
import { HiddenLibrary } from './rooms/HiddenLibrary'
import { ForestTransition } from './rooms/ForestTransition'
import { ForestEntrance } from './rooms/ForestEntrance'
import { AncientGrove } from './rooms/AncientGrove'
import { WhisperingGlade } from './rooms/WhisperingGlade'
import { HeartOfTheForest } from './rooms/HeartOfTheForest'
import { TheGatheringStormQuest } from './quests/TheGatheringStorm'
import { TheKnightsTestQuest } from './quests/TheKnightsTest'
import { SuppliesForTheJourneyQuest } from './quests/SuppliesForTheJourney'
import { EchoesOfThePastQuest } from './quests/EchoesOfThePast'
import { TheInnkeepersDaughterQuest } from './quests/TheInnkeepersDaughter'
import { TheMerchantsLostCaravanQuest } from './quests/TheMerchantsLostCaravan'
import { TheHealersApprenticeQuest } from './quests/TheHealersApprentice'
import { TheAncientLibraryQuest } from './quests/TheAncientLibrary'
import { TheForestGuardiansRiddles } from './quests/TheForestGuardiansRiddles'
import { TheHermitsWarningQuest } from './quests/TheHermitsWarning'
import { WhispersInTheWind } from './quests/WhispersInTheWind'
import { CASTLE_APPROACH_DESCRIPTION } from './rooms/CastleApproach'
import { FOREST_ENTRANCE_DESCRIPTION } from './rooms/ForestEntrance'
import { CASTLE_COURTYARD_DESCRIPTION } from './rooms/CastleCourtyard'
import { GREAT_HALL_DESCRIPTION } from './rooms/GreatHall'
import { CedricksLostHonorQuest } from './quests/CedricksLostHonorQuest'
import {
  SECRET_DOCUMENTS_DESCRIPTION,
  SecretDocuments,
} from './items/SecretDocuments'
import { SirCedric } from './characters/SirCedric'
import {
  CITY_NOTICE_BOARD_DESCRIPTION,
  CityNoticeBoard,
} from './items/CityNoticeBoard'
import { SQUIRES_DIARY_DESCRIPTION, SquiresDiary } from './items/SquiresDiary'
import { FLAG_GATHERING_STORM_COMPLETED } from './Act2StoryFlags'
import { ACT2_CLASSES } from './classes'
import { ACT2_GOLDEN_PATH } from './Act2GoldenPath'

/** Act 2: Greendale & The Forest Edge. */
export class Act2 extends Act {
  constructor() {
    const rooms = {
      MountainPath: new MountainPath(),
      GreendaleGates: new GreendaleGates(),
      MainSquare: new MainSquare(),
      MarketDistrict: new MarketDistrict(),
      SilverStagInn: new SilverStagInn(),
      InnRooms: new InnRooms(),
      MerchantsWarehouse: new MerchantsWarehouse(),
      CastleApproach: new CastleApproach(),
      CastleCourtyard: new CastleCourtyard(),
      GreatHall: new GreatHall(),
      ResidentialQuarter: new ResidentialQuarter(),
      HealersHouse: new HealersHouse(),
      HiddenLibrary: new HiddenLibrary(),
      ForestTransition: new ForestTransition(),
      ForestEntrance: new ForestEntrance(),
      AncientGrove: new AncientGrove(),
      WhisperingGlade: new WhisperingGlade(),
      HeartOfTheForest: new HeartOfTheForest(),
    }
    const quests = [
      // Main Quest
      new TheGatheringStormQuest(),

      // Greendale Phase Side Quests
      new TheKnightsTestQuest(),
      new SuppliesForTheJourneyQuest(),
      new EchoesOfThePastQuest(),
      new TheHealersApprenticeQuest(),
      new TheAncientLibraryQuest(),
      new TheInnkeepersDaughterQuest(),
      new CedricksLostHonorQuest(),

      // Forest Phase Side Quests
      new TheMerchantsLostCaravanQuest(),
      new TheForestGuardiansRiddles(),
      new WhispersInTheWind(),
      new TheHermitsWarningQuest(),
    ]
    super({
      name: 'Act2',
      rooms,
      quests,
      musicFile: 'Walen - Medieval Village (freetouse.com).mp3',
      musicInfo:
        'Music track: Medieval Village by Walen\nSource: https://freetouse.com/music\n' +
        'Free To Use Music for Video',
      classes: ACT2_CLASSES,
      goldenPath: ACT2_GOLDEN_PATH,
    })
  }

  /** The hook that opens Act II's complete page: Malakar is real and seeks Elior's bloodline. */
  override getCompletionHook(): string {
    return 'Malakar is real. And the bloodline he seeks is yours.'
  }

  /** The Act II opening page: arrival at Greendale, quoting only Mira's and Grandmother's Act I words. */
  override getActIntro(): string {
    return (
      '[bold]ACT 2: THE GATHERING STORM[/bold]\n\nAfter the mysterious ' +
      'events in Willowbrook and the revelation of your growing magical ' +
      'abilities, you have left your quiet village behind. The mountain ' +
      'path stretches before you, winding through rocky terrain toward ' +
      'your destination: Greendale, a bustling city that serves as the ' +
      'gateway between civilization and the mystical Enchanted ' +
      'Forest.\n\nAs you crest the final ridge, the sight takes your ' +
      'breath away. Below lies Greendale—larger than any settlement ' +
      "you've ever seen, with stone buildings, busy market squares, and " +
      'an impressive castle rising majestically above the city walls. ' +
      'Smoke rises from countless chimneys, and you can hear the distant ' +
      'sounds of commerce and conversation carried on the mountain ' +
      "breeze.\n\nMira's parting words go with you: " +
      speech(
        "'Your road leads to Greendale, " +
          characterName('Elior') +
          '. Once there, show the amulet to no one lightly. Those who know ' +
          "what it is will find you.'",
      ) +
      ' The [item_name]Ancient Amulet[/item_name] your parents left you lies ' +
      'hidden under your shirt, warm against your chest. Someone came to ' +
      'Willowbrook looking for it, your grandmother said. Keep it hidden.' +
      '\n\nBeyond Greendale, ' +
      'you glimpse the edge of the Enchanted Forest—an ancient woodland ' +
      'where magic flows like water and spirits older than memory dwell ' +
      'among the trees. The very air seems to shimmer with possibility ' +
      'and danger.\n\nThis is where your true journey begins. In ' +
      'Greendale, you must prove yourself worthy, forge alliances with ' +
      'powerful allies, and master the magical arts. Only then will you ' +
      "be ready to face the forest's deepest secrets and the growing " +
      'storm that threatens all you hold dear.\n\nTake a deep breath, and ' +
      'start down the road into Greendale.\n'
    )
  }

  /** Give Elior the amulet Mira gave him; runs only for a fresh Act II, never on load. */
  override setupGameState(gameState: GameState): void {
    gameState.addItemToInventory(new AncientAmulet())
  }

  /**
   * Bring older saves up to date: the secret documents, the squire's diary,
   * the castle rooms and Cedric's quest log keep the text they were saved with, so give them the
   * current wording, and put Brenn in the warehouse of saves made before he
   * was met there. Safe to run on every load.
   */
  override afterLoad(gameState: GameState): void {
    gameState.allRooms.CastleApproach.description = CASTLE_APPROACH_DESCRIPTION
    gameState.allRooms.CastleCourtyard.description =
      CASTLE_COURTYARD_DESCRIPTION
    gameState.allRooms.GreatHall.description = GREAT_HALL_DESCRIPTION
    gameState.allRooms.ForestEntrance.description = FOREST_ENTRANCE_DESCRIPTION
    SirCedric.refreshAll(gameState)
    const warehouse = gameState.allRooms.MerchantsWarehouse
    if (!warehouse.characters.some((c) => c instanceof Brenn))
      warehouse.characters.push(new Brenn())
    const items: Item[] = [...gameState.inventory]
    for (const room of Object.values(gameState.allRooms))
      items.push(...room.items)
    for (const item of items) {
      if (item instanceof SecretDocuments)
        item.description = SECRET_DOCUMENTS_DESCRIPTION
      if (item instanceof SquiresDiary)
        item.description = SQUIRES_DIARY_DESCRIPTION
      if (item instanceof CityNoticeBoard)
        item.description = CITY_NOTICE_BOARD_DESCRIPTION
    }
    for (const quest of [
      ...gameState.nonActivatedQuests,
      ...gameState.activatedQuests,
      ...gameState.completedQuests,
    ]) {
      if (quest instanceof CedricksLostHonorQuest) quest.refreshText(gameState)
    }
  }

  override isCompleted(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_GATHERING_STORM_COMPLETED)
  }
}
