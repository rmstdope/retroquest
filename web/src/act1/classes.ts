/**
 * Every content class of Act 1 by name, so saves can refer to them.
 */
import { AncientAmulet } from './items/AncientAmulet'
import { Apple } from './items/Apple'
import { Armor } from './items/Armor'
import { Bread } from './items/Bread'
import { BrokenShovel } from './items/BrokenShovel'
import { Bucket } from './items/Bucket'
import { Bush } from './items/Bush'
import { Hearth } from './items/Hearth'
import { Candle } from './items/Candle'
import { Chicken } from './items/Chicken'
import { Coin } from './items/Coin'
import { DullKnife } from './items/DullKnife'
import { Egg } from './items/Egg'
import { EliorsJournal } from './items/EliorsJournal'
import { ExtendedMagneticFishingRod } from './items/ExtendedMagneticFishingRod'
import { FadedPhotograph } from './items/FadedPhotograph'
import { Feather } from './items/Feather'
import { Fish } from './items/Fish'
import { FishingRod } from './items/FishingRod'
import { FreshBread } from './items/FreshBread'
import { HealingHerb } from './items/HealingHerb'
import { Horseshoe } from './items/Horseshoe'
import { Key } from './items/Key'
import { Lantern } from './items/Lantern'
import { Locket } from './items/Locket'
import { Magnet } from './items/Magnet'
import { MagneticFishingRod } from './items/MagneticFishingRod'
import { GameMap } from './items/GameMap'
import { Matches } from './items/Matches'
import { Mechanism } from './items/Mechanism'
import { MillstoneFragment } from './items/MillstoneFragment'
import { MothersLetter } from './items/MothersLetter'
import { MysteriousBox } from './items/MysteriousBox'
import { OldNotice } from './items/OldNotice'
import { PrayerBook } from './items/PrayerBook'
import { RareFlower } from './items/RareFlower'
import { River } from './items/River'
import { Rope } from './items/Rope'
import { RuneToken } from './items/RuneToken'
import { RustyHoe } from './items/RustyHoe'
import { RustySaw } from './items/RustySaw'
import { SackOfFlour } from './items/SackOfFlour'
import { SharpKnife } from './items/SharpKnife'
import { ShedDoor } from './items/ShedDoor'
import { ShinyPebble } from './items/ShinyPebble'
import { ShinyRing } from './items/ShinyRing'
import { Snare } from './items/Snare'
import { SmoothStone } from './items/SmoothStone'
import { Stick } from './items/Stick'
import { Sword } from './items/Sword'
import { TravelCloak } from './items/TravelCloak'
import { Vines } from './items/Vines'
import { WanderingBoots } from './items/WanderingBoots'
import { Well } from './items/Well'
import { WildBerries } from './items/WildBerries'
import { WitheredCarrot } from './items/WitheredCarrot'
import { Blacksmith } from './characters/Blacksmith'
import { Deer } from './characters/Deer'
import { DreamVoice } from './characters/DreamVoice'
import { Fisherman } from './characters/Fisherman'
import { Grandmother } from './characters/Grandmother'
import { Merchant } from './characters/Merchant'
import { Mira } from './characters/Mira'
import { Patches } from './characters/Patches'
import { Priest } from './characters/Priest'
import { Shopkeeper } from './characters/Shopkeeper'
import { Villager } from './characters/Villager'
import { AbandonedShed } from './rooms/AbandonedShed'
import { BlacksmithsForge } from './rooms/BlacksmithsForge'
import { ChickenCoop } from './rooms/ChickenCoop'
import { EliorsCottage } from './rooms/EliorsCottage'
import { ForestPath } from './rooms/ForestPath'
import { GeneralStore } from './rooms/GeneralStore'
import { HiddenGlade } from './rooms/HiddenGlade'
import { TheDream } from './rooms/TheDream'
import { MirasHut } from './rooms/MirasHut'
import { OldMill } from './rooms/OldMill'
import { Riverbank } from './rooms/Riverbank'
import { RoadToGreendale } from './rooms/RoadToGreendale'
import { VegetableField } from './rooms/VegetableField'
import { VillageChapel } from './rooms/VillageChapel'
import { VillageSquare } from './rooms/VillageSquare'
import { VillageWell } from './rooms/VillageWell'
import { CuriosityKilledTheCatQuest } from './quests/CuriosityKilledTheCat'
import { FadedPhotographQuest } from './quests/FadedPhotograph'
import { FishingExpeditionQuest } from './quests/FishingExpedition'
import { HintOfMagicQuest } from './quests/HintOfMagic'
import { KnowYourVillageQuest } from './quests/KnowYourVillage'
import { LetThereBeLightQuest } from './quests/LetThereBeLight'
import { MagicForRealQuest } from './quests/MagicForReal'
import { MagnetFishingExpeditionQuest } from './quests/MagnetFishingExpedition'
import { OhDeerOhDeerQuest } from './quests/OhDeerOhDeer'
import { PreparingForTheRoadQuest } from './quests/PreparingForTheRoad'
import { ShadowsOverWillowbrookQuest } from './quests/ShadowsOverWillowbrook'
import { BlessSpell } from './spells/BlessSpell'
import { GrowSpell } from './spells/GrowSpell'
import { HealSpell } from './spells/HealSpell'
import { LightSpell } from './spells/LightSpell'
import { PurifySpell } from './spells/PurifySpell'
import { ReviveSpell } from './spells/ReviveSpell'
import { UnlockSpell } from './spells/UnlockSpell'

export const ACT1_CLASSES = {
  // Items
  AncientAmulet,
  Apple,
  Armor,
  Bread,
  BrokenShovel,
  Bucket,
  Bush,
  Hearth,
  Candle,
  Chicken,
  Coin,
  DullKnife,
  Egg,
  EliorsJournal,
  ExtendedMagneticFishingRod,
  FadedPhotograph,
  Feather,
  Fish,
  FishingRod,
  FreshBread,
  HealingHerb,
  Horseshoe,
  Key,
  Lantern,
  Locket,
  Magnet,
  MagneticFishingRod,
  GameMap,
  Matches,
  Mechanism,
  MillstoneFragment,
  MothersLetter,
  MysteriousBox,
  OldNotice,
  PrayerBook,
  RareFlower,
  River,
  Rope,
  RuneToken,
  RustyHoe,
  RustySaw,
  SackOfFlour,
  SharpKnife,
  ShedDoor,
  ShinyPebble,
  ShinyRing,
  Snare,
  SmoothStone,
  Stick,
  Sword,
  TravelCloak,
  Vines,
  WanderingBoots,
  Well,
  WildBerries,
  WitheredCarrot,
  // Characters
  Blacksmith,
  Deer,
  DreamVoice,
  Fisherman,
  Grandmother,
  Merchant,
  Mira,
  Priest,
  Patches,
  Shopkeeper,
  Villager,
  // Rooms
  AbandonedShed,
  BlacksmithsForge,
  ChickenCoop,
  EliorsCottage,
  ForestPath,
  GeneralStore,
  HiddenGlade,
  MirasHut,
  TheDream,
  OldMill,
  Riverbank,
  RoadToGreendale,
  VegetableField,
  VillageChapel,
  VillageSquare,
  VillageWell,
  // Quests
  CuriosityKilledTheCatQuest,
  FadedPhotographQuest,
  FishingExpeditionQuest,
  HintOfMagicQuest,
  KnowYourVillageQuest,
  LetThereBeLightQuest,
  MagicForRealQuest,
  MagnetFishingExpeditionQuest,
  OhDeerOhDeerQuest,
  PreparingForTheRoadQuest,
  ShadowsOverWillowbrookQuest,
  // Spells
  BlessSpell,
  GrowSpell,
  HealSpell,
  LightSpell,
  PurifySpell,
  ReviveSpell,
  UnlockSpell,
}
