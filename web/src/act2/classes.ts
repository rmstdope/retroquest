/**
 * Every content class of Act 2 by name, so saves can refer to them.
 */
import { AdvancedHealingPotion } from './items/AdvancedHealingPotion'
import { AncientChronicle } from './items/AncientChronicle'
import { BoundaryStoneFragment } from './items/BoundaryStoneFragment'
import { CampSite } from './items/CampSite'
import { Caravan } from './items/Caravan'
import { CityMap } from './items/CityMap'
import { CityNoticeBoard } from './items/CityNoticeBoard'
import { Coins } from './items/Coins'
import { CrystalClearWater } from './items/CrystalClearWater'
import { CrystalFocus } from './items/CrystalFocus'
import { Door } from './items/Door'
import { DruidicCharm } from './items/DruidicCharm'
import { DruidicFocus } from './items/DruidicFocus'
import { EnchantedAcorn } from './items/EnchantedAcorn'
import { EnhancedLantern } from './items/EnhancedLantern'
import { EntryPass } from './items/EntryPass'
import { ForestHeartCrystal } from './items/ForestHeartCrystal'
import { ForestSurvivalKit } from './items/ForestSurvivalKit'
import { HealingHerbs } from './items/HealingHerbs'
import { MerchantsFlyer } from './items/MerchantsFlyer'
import { Moonflowers } from './items/Moonflowers'
import { MountainFlower } from './items/MountainFlower'
import { NaturesCharm } from './items/NaturesCharm'
import { NyxToken } from './items/NyxToken'
import { OfferingAltar } from './items/OfferingAltar'
import { ProtectiveCharm } from './items/ProtectiveCharm'
import { ProtectiveEnchantments } from './items/ProtectiveEnchantments'
import { QualityRope } from './items/QualityRope'
import { Ravine } from './items/Ravine'
import { RoomKey } from './items/RoomKey'
import { SecretDocuments } from './items/SecretDocuments'
import { SilverLeaves } from './items/SilverLeaves'
import { SilverTree } from './items/SilverTree'
import { SquiresDiary } from './items/SquiresDiary'
import { StandingStones } from './items/StandingStones'
import { TrainingSword } from './items/TrainingSword'
import { TravelersJournal } from './items/TravelersJournal'
import { WalkingStick } from './items/WalkingStick'
import { AncientTreeSpirit } from './characters/AncientTreeSpirit'
import { BarmaidElena } from './characters/BarmaidElena'
import { CaravanMasterThorne } from './characters/CaravanMasterThorne'
import { CastleGuardCaptain } from './characters/CastleGuardCaptain'
import { CourtHerald } from './characters/CourtHerald'
import { Families } from './characters/Families'
import { ForestHermit } from './characters/ForestHermit'
import { ForestSprites } from './characters/ForestSprites'
import { GateCaptain } from './characters/GateCaptain'
import { Herald } from './characters/Herald'
import { Historians } from './characters/Historians'
import { InnkeeperMarcus } from './characters/InnkeeperMarcus'
import { LocalCraftsmen } from './characters/LocalCraftsmen'
import { LordCommander } from './characters/LordCommander'
import { MasterHealerLyria } from './characters/MasterHealerLyria'
import { MasterMerchantAldric } from './characters/MasterMerchantAldric'
import { MountainHermit } from './characters/MountainHermit'
import { Nyx } from './characters/Nyx'
import { SirCedric } from './characters/SirCedric'
import { SpectralLibrarian } from './characters/SpectralLibrarian'
import { Squires } from './characters/Squires'
import { TownCrier } from './characters/TownCrier'
import { TrainingMaster } from './characters/TrainingMaster'
import { WaterNymphs } from './characters/WaterNymphs'
import { AncientGrove } from './rooms/AncientGrove'
import { CastleApproach } from './rooms/CastleApproach'
import { CastleCourtyard } from './rooms/CastleCourtyard'
import { ForestEntrance } from './rooms/ForestEntrance'
import { ForestTransition } from './rooms/ForestTransition'
import { GreatHall } from './rooms/GreatHall'
import { GreendaleGates } from './rooms/GreendaleGates'
import { HealersHouse } from './rooms/HealersHouse'
import { HeartOfTheForest } from './rooms/HeartOfTheForest'
import { HiddenLibrary } from './rooms/HiddenLibrary'
import { InnRooms } from './rooms/InnRooms'
import { MainSquare } from './rooms/MainSquare'
import { MarketDistrict } from './rooms/MarketDistrict'
import { MerchantsWarehouse } from './rooms/MerchantsWarehouse'
import { MountainPath } from './rooms/MountainPath'
import { ResidentialQuarter } from './rooms/ResidentialQuarter'
import { SilverStagInn } from './rooms/SilverStagInn'
import { WhisperingGlade } from './rooms/WhisperingGlade'
import { CedricksLostHonorQuest } from './quests/CedricksLostHonorQuest'
import { EchoesOfThePastQuest } from './quests/EchoesOfThePast'
import { SuppliesForTheJourneyQuest } from './quests/SuppliesForTheJourney'
import { TheAncientLibraryQuest } from './quests/TheAncientLibrary'
import { TheForestGuardiansRiddles } from './quests/TheForestGuardiansRiddles'
import { TheGatheringStormQuest } from './quests/TheGatheringStorm'
import { TheHealersApprenticeQuest } from './quests/TheHealersApprentice'
import { TheHermitsWarningQuest } from './quests/TheHermitsWarning'
import { TheInnkeepersDaughterQuest } from './quests/TheInnkeepersDaughter'
import { TheKnightsTestQuest } from './quests/TheKnightsTest'
import { TheMerchantsLostCaravanQuest } from './quests/TheMerchantsLostCaravan'
import { WhispersInTheWind } from './quests/WhispersInTheWind'
import { DispelSpell } from './spells/DispelSpell'
import { ForestSpeechSpell } from './spells/ForestSpeechSpell'
import { GreaterHealSpell } from './spells/GreaterHealSpell'
import { MendSpell } from './spells/MendSpell'
import { NatureSenseSpell } from './spells/NatureSenseSpell'
import { PropheticVision } from './spells/PropheticVision'

export const ACT2_CLASSES = {
  // Items
  AdvancedHealingPotion,
  AncientChronicle,
  BoundaryStoneFragment,
  CampSite,
  Caravan,
  CityMap,
  CityNoticeBoard,
  Coins,
  CrystalClearWater,
  CrystalFocus,
  Door,
  DruidicCharm,
  DruidicFocus,
  EnchantedAcorn,
  EnhancedLantern,
  EntryPass,
  ForestHeartCrystal,
  ForestSurvivalKit,
  HealingHerbs,
  MerchantsFlyer,
  Moonflowers,
  MountainFlower,
  NaturesCharm,
  NyxToken,
  OfferingAltar,
  ProtectiveCharm,
  ProtectiveEnchantments,
  QualityRope,
  Ravine,
  RoomKey,
  SecretDocuments,
  SilverLeaves,
  SilverTree,
  SquiresDiary,
  StandingStones,
  TrainingSword,
  TravelersJournal,
  WalkingStick,
  // Characters
  AncientTreeSpirit,
  BarmaidElena,
  CaravanMasterThorne,
  CastleGuardCaptain,
  CourtHerald,
  Families,
  ForestHermit,
  ForestSprites,
  GateCaptain,
  Herald,
  Historians,
  InnkeeperMarcus,
  LocalCraftsmen,
  LordCommander,
  MasterHealerLyria,
  MasterMerchantAldric,
  MountainHermit,
  Nyx,
  SirCedric,
  SpectralLibrarian,
  Squires,
  TownCrier,
  TrainingMaster,
  WaterNymphs,
  // Rooms
  AncientGrove,
  CastleApproach,
  CastleCourtyard,
  ForestEntrance,
  ForestTransition,
  GreatHall,
  GreendaleGates,
  HealersHouse,
  HeartOfTheForest,
  HiddenLibrary,
  InnRooms,
  MainSquare,
  MarketDistrict,
  MerchantsWarehouse,
  MountainPath,
  ResidentialQuarter,
  SilverStagInn,
  WhisperingGlade,
  // Quests
  CedricksLostHonorQuest,
  EchoesOfThePastQuest,
  SuppliesForTheJourneyQuest,
  TheAncientLibraryQuest,
  TheForestGuardiansRiddles,
  TheGatheringStormQuest,
  TheHealersApprenticeQuest,
  TheHermitsWarningQuest,
  TheInnkeepersDaughterQuest,
  TheKnightsTestQuest,
  TheMerchantsLostCaravanQuest,
  WhispersInTheWind,
  // Spells
  DispelSpell,
  ForestSpeechSpell,
  GreaterHealSpell,
  MendSpell,
  NatureSenseSpell,
  PropheticVision,
}
