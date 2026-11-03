import { Act, characterName, type GameState, speech } from '@/engine'
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
import { CedricksLostHonorQuest } from './quests/CedricksLostHonorQuest'
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
      '[bold]ACT 2: THE GATHERING STORM[/bold]\n\nYou left Willowbrook to ' +
      'the sound of the chapel bell, ringing once with no hand on the rope. ' +
      'The mountain path took you up through rock and pine, and from the ' +
      'last ridge you see Greendale: stone houses, more chimneys than you ' +
      'can count, and a white castle above the walls. No banner flies from ' +
      "its highest spire.\n\nMira's parting words go with you: " +
      speech(
        'Your road leads to Greendale, ' +
          characterName('Elior') +
          '. Once there, show the amulet to no one lightly. Those who know ' +
          'what it is will find you.',
      ) +
      ' The [item_name]ancient amulet[/item_name] your parents left you lies ' +
      'hidden under your shirt, warm against your chest. Someone came to ' +
      'Willowbrook looking for it, your grandmother said. Keep it hidden.' +
      '\n\nMalakar, to you, is a word from Willowbrook: a name your neighbours ' +
      'say over bad weather and bad luck, and knock on wood after. A tale ' +
      "to frighten children, and one line in your mother's hand that called " +
      'him a friend once.' +
      '\n\nEast of the city the Enchanted Forest begins, a dark line of trees ' +
      'as far as you can see.\n\nTake a deep breath, and ' +
      'start down the road into Greendale.\n'
    )
  }

  /** Give Elior the amulet Mira gave him; runs only for a fresh Act II, never on load. */
  override setupGameState(gameState: GameState): void {
    gameState.addItemToInventory(new AncientAmulet())
  }

  /**
   * Bring older saves up to date: put Brenn in the warehouse of saves made
   * before he was met there, and slot story beats an older Gathering Storm
   * log never noted into place. Saved wording is refreshed by the rooms,
   * items, characters, spells and quests themselves (`refreshSavedText`).
   * Safe to run on every load.
   */
  override afterLoad(gameState: GameState): void {
    const warehouse = gameState.allRooms.MerchantsWarehouse
    if (!warehouse.characters.some((c) => c instanceof Brenn))
      warehouse.characters.push(new Brenn())
    for (const quest of [
      ...gameState.nonActivatedQuests,
      ...gameState.activatedQuests,
      ...gameState.completedQuests,
    ])
      if (quest instanceof TheGatheringStormQuest)
        quest.migrateOlderSave(gameState)
  }

  override isCompleted(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_GATHERING_STORM_COMPLETED)
  }
}
