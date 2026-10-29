import { Act, characterName, type GameState, type Item, speech } from '@/engine'
import { Brenn } from './characters/Brenn'
import { DispelSpell } from './spells/DispelSpell'
import { ForestSpeechSpell } from './spells/ForestSpeechSpell'
import { GreaterHealSpell } from './spells/GreaterHealSpell'
import { MendSpell } from './spells/MendSpell'
import { NatureSenseSpell } from './spells/NatureSenseSpell'
import { PropheticVision } from './spells/PropheticVision'
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
import {
  MountainHermit,
  MOUNTAIN_HERMIT_DESCRIPTION,
} from './characters/MountainHermit'
import { TheInnkeepersDaughterQuest } from './quests/TheInnkeepersDaughter'
import { TheMerchantsLostCaravanQuest } from './quests/TheMerchantsLostCaravan'
import { TheHealersApprenticeQuest } from './quests/TheHealersApprentice'
import { TheAncientLibraryQuest } from './quests/TheAncientLibrary'
import { TheForestGuardiansRiddles } from './quests/TheForestGuardiansRiddles'
import { TheHermitsWarningQuest } from './quests/TheHermitsWarning'
import { WhispersInTheWind } from './quests/WhispersInTheWind'
import { CASTLE_APPROACH_DESCRIPTION } from './rooms/CastleApproach'
import { MAIN_SQUARE_DESCRIPTION } from './rooms/MainSquare'
import { HEALERS_HOUSE_DESCRIPTION } from './rooms/HealersHouse'
import { RESIDENTIAL_QUARTER_DESCRIPTION } from './rooms/ResidentialQuarter'
import { FOREST_ENTRANCE_DESCRIPTION } from './rooms/ForestEntrance'
import { CASTLE_COURTYARD_DESCRIPTION } from './rooms/CastleCourtyard'
import { GREAT_HALL_DESCRIPTION } from './rooms/GreatHall'
import { CedricksLostHonorQuest } from './quests/CedricksLostHonorQuest'
import { FLYER_DESCRIPTION, MerchantsFlyer } from './items/MerchantsFlyer'
import { Coins, COINS_DESCRIPTION } from './items/Coins'
import { DruidicCharm, DRUIDIC_CHARM_DESCRIPTION } from './items/DruidicCharm'
import {
  EnchantedAcorn,
  ENCHANTED_ACORN_DESCRIPTION,
} from './items/EnchantedAcorn'
import {
  ForestHeartCrystal,
  FOREST_HEART_CRYSTAL_DESCRIPTION,
} from './items/ForestHeartCrystal'
import { NaturesCharm, NATURES_CHARM_DESCRIPTION } from './items/NaturesCharm'
import { NyxToken, NYX_TOKEN_DESCRIPTION } from './items/NyxToken'
import {
  OfferingAltar,
  OFFERING_ALTAR_DESCRIPTION,
} from './items/OfferingAltar'
import {
  ProtectiveCharm,
  PROTECTIVE_CHARM_DESCRIPTION,
} from './items/ProtectiveCharm'
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

/** The quests whose log text is set again on every load, so older saves read the current wording. */
const REFRESHED_QUESTS = [
  TheHermitsWarningQuest,
  TheForestGuardiansRiddles,
  WhispersInTheWind,
  TheKnightsTestQuest,
  SuppliesForTheJourneyQuest,
  TheAncientLibraryQuest,
  EchoesOfThePastQuest,
  TheMerchantsLostCaravanQuest,
]

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
   * Bring older saves up to date: the coins, the merchant's flyer, the secret
   * documents, the squire's diary, the altar, the charms, the acorn, Nyx's
   * gifts, the spells' descriptions, the castle rooms, the Main Square, the
   * Healer's House, the
   * Residential Quarter, Cedric's quest log and the riddles quest log keep the
   * text they were saved with, so give them the current wording, and put Brenn
   * in the warehouse of saves made before he was met there. Safe to run on
   * every load.
   */
  override afterLoad(gameState: GameState): void {
    gameState.allRooms.CastleApproach.description = CASTLE_APPROACH_DESCRIPTION
    gameState.allRooms.MainSquare.description = MAIN_SQUARE_DESCRIPTION
    gameState.allRooms.HealersHouse.description = HEALERS_HOUSE_DESCRIPTION
    gameState.allRooms.ResidentialQuarter.description =
      RESIDENTIAL_QUARTER_DESCRIPTION
    gameState.allRooms.CastleCourtyard.description =
      CASTLE_COURTYARD_DESCRIPTION
    gameState.allRooms.GreatHall.description = GREAT_HALL_DESCRIPTION
    gameState.allRooms.ForestEntrance.description = FOREST_ENTRANCE_DESCRIPTION
    SirCedric.refreshAll(gameState)
    for (const spell of [
      new MendSpell(),
      new GreaterHealSpell(),
      new DispelSpell(),
      new NatureSenseSpell(),
      new ForestSpeechSpell(),
      new PropheticVision(),
    ]) {
      const known = gameState.knownSpells.find((s) => s.id === spell.id)
      if (known) known.description = spell.description
    }
    for (const room of Object.values(gameState.allRooms))
      for (const character of room.characters)
        if (character instanceof MountainHermit)
          character.description = MOUNTAIN_HERMIT_DESCRIPTION
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
      if (item instanceof Coins) item.description = COINS_DESCRIPTION
      if (item instanceof MerchantsFlyer) item.description = FLYER_DESCRIPTION
      if (item instanceof OfferingAltar)
        item.description = OFFERING_ALTAR_DESCRIPTION
      if (item instanceof DruidicCharm)
        item.description = DRUIDIC_CHARM_DESCRIPTION
      if (item instanceof ProtectiveCharm)
        item.description = PROTECTIVE_CHARM_DESCRIPTION
      if (item instanceof NaturesCharm)
        item.description = NATURES_CHARM_DESCRIPTION
      if (item instanceof EnchantedAcorn)
        item.description = ENCHANTED_ACORN_DESCRIPTION
      if (item instanceof NyxToken) item.description = NYX_TOKEN_DESCRIPTION
      if (item instanceof ForestHeartCrystal)
        item.description = FOREST_HEART_CRYSTAL_DESCRIPTION
    }
    for (const quest of [
      ...gameState.nonActivatedQuests,
      ...gameState.activatedQuests,
      ...gameState.completedQuests,
    ]) {
      if (quest instanceof CedricksLostHonorQuest) quest.refreshText(gameState)
      for (const kind of REFRESHED_QUESTS)
        if (quest instanceof kind) quest.refreshText()
      if (quest instanceof TheInnkeepersDaughterQuest) quest.refreshText()
      if (quest instanceof TheGatheringStormQuest)
        quest.migrateOlderSave(gameState)
    }
  }

  override isCompleted(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_GATHERING_STORM_COMPLETED)
  }
}
