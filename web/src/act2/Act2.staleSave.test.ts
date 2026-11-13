import { describe, it, expect } from 'vitest'
import { Game, type Character, type Item, type Room } from '@/engine'
import { staleSaveMismatches, type StaleTextCase } from '@/testing/staleSave'
import { Act2 } from './Act2'
import { MountainHermit } from './characters/MountainHermit'
import { SirCedric } from './characters/SirCedric'
import { CityNoticeBoard } from './items/CityNoticeBoard'
import { Coins } from './items/Coins'
import { CrystalClearWater } from './items/CrystalClearWater'
import { CrystalFocus } from './items/CrystalFocus'
import { DruidicCharm } from './items/DruidicCharm'
import { EnchantedAcorn } from './items/EnchantedAcorn'
import { ForestHeartCrystal } from './items/ForestHeartCrystal'
import { ForestSurvivalKit } from './items/ForestSurvivalKit'
import { MerchantsFlyer } from './items/MerchantsFlyer'
import { Moonflowers } from './items/Moonflowers'
import { NaturesCharm } from './items/NaturesCharm'
import { NyxToken } from './items/NyxToken'
import { OfferingAltar } from './items/OfferingAltar'
import { ProtectiveCharm } from './items/ProtectiveCharm'
import { SilverLeaves } from './items/SilverLeaves'
import { EchoesOfThePastQuest } from './quests/EchoesOfThePast'
import { SuppliesForTheJourneyQuest } from './quests/SuppliesForTheJourney'
import { TheAncientLibraryQuest } from './quests/TheAncientLibrary'
import { TheForestGuardiansRiddles } from './quests/TheForestGuardiansRiddles'
import { TheHermitsWarningQuest } from './quests/TheHermitsWarning'
import { TheInnkeepersDaughterQuest } from './quests/TheInnkeepersDaughter'
import { TheKnightsTestQuest } from './quests/TheKnightsTest'
import { TheMerchantsLostCaravanQuest } from './quests/TheMerchantsLostCaravan'
import { WhispersInTheWind } from './quests/WhispersInTheWind'
import { AncientGrove } from './rooms/AncientGrove'
import { ForestEntrance } from './rooms/ForestEntrance'
import { HealersHouse } from './rooms/HealersHouse'
import { HeartOfTheForest } from './rooms/HeartOfTheForest'
import { MainSquare } from './rooms/MainSquare'
import { MountainPath } from './rooms/MountainPath'
import { ResidentialQuarter } from './rooms/ResidentialQuarter'
import { WhisperingGlade } from './rooms/WhisperingGlade'
import { DispelSpell } from './spells/DispelSpell'
import { ForestSpeechSpell } from './spells/ForestSpeechSpell'
import { GreaterHealSpell } from './spells/GreaterHealSpell'
import { MendSpell } from './spells/MendSpell'
import { NatureSenseSpell } from './spells/NatureSenseSpell'
import { PropheticVision } from './spells/PropheticVision'

/** The quests whose name or wording an older save holds in the old form, and the fields that changed. */
const QUEST_CASES: StaleTextCase[] = [
  { target: TheHermitsWarningQuest, fields: ['description'] },
  { target: TheForestGuardiansRiddles, fields: ['description', 'completion'] },
  { target: WhispersInTheWind, fields: ['description', 'completion'] },
  { target: TheKnightsTestQuest, fields: ['description', 'completion'] },
  { target: SuppliesForTheJourneyQuest, fields: ['description', 'completion'] },
  { target: TheAncientLibraryQuest, fields: ['description', 'completion'] },
  { target: EchoesOfThePastQuest, fields: ['description'] },
  { target: TheMerchantsLostCaravanQuest, fields: ['completion'] },
  { target: TheInnkeepersDaughterQuest, fields: ['description', 'completion'] },
]

/** The spells whose wording an older save holds in the old form. */
const OBJECT_CASES: StaleTextCase[] = [
  { target: MendSpell, fields: ['description'] },
  { target: GreaterHealSpell, fields: ['description'] },
  { target: DispelSpell, fields: ['description'] },
  { target: NatureSenseSpell, fields: ['description'] },
  { target: ForestSpeechSpell, fields: ['description'] },
  { target: PropheticVision, fields: ['description'] },
]

/** The rooms, characters and items whose look is computed, so a saved old wording never shows. */
const COMPUTED_LOOKS: (new () => Room | Character | Item)[] = [
  WhisperingGlade,
  HeartOfTheForest,
  AncientGrove,
  MountainPath,
  MainSquare,
  HealersHouse,
  ResidentialQuarter,
  ForestEntrance,
  MountainHermit,
  SirCedric,
  CityNoticeBoard,
  OfferingAltar,
  Coins,
  MerchantsFlyer,
  CrystalClearWater,
  Moonflowers,
  SilverLeaves,
  CrystalFocus,
  ForestSurvivalKit,
  DruidicCharm,
  ProtectiveCharm,
  NaturesCharm,
  EnchantedAcorn,
  NyxToken,
  ForestHeartCrystal,
]

/** An Act II game carrying every item and knowing every spell the cases check. */
function prepare(game: Game): void {
  for (const item of [
    new Coins(),
    new MerchantsFlyer(),
    new CrystalClearWater(),
    new Moonflowers(),
    new SilverLeaves(),
    new CrystalFocus(),
    new ForestSurvivalKit(),
    new DruidicCharm(),
    new ProtectiveCharm(),
    new NaturesCharm(),
    new EnchantedAcorn(),
    new NyxToken(),
    new ForestHeartCrystal(),
  ]) {
    game.state.addItemToInventory(item)
  }
  for (const spell of [
    new MendSpell(),
    new GreaterHealSpell(),
    new DispelSpell(),
    new NatureSenseSpell(),
    new ForestSpeechSpell(),
    new PropheticVision(),
  ]) {
    game.state.learnSpell(spell)
  }
}

/** The same game with every quest finished, as a save made after the act's quests were done holds them. */
function prepareFinished(game: Game): void {
  prepare(game)
  for (const quest of game.state.nonActivatedQuests) quest.completed = true
  game.state.settleFinishedQuests()
}

describe('Act II loading a save that holds old wording', () => {
  it('gives every object the current wording', () => {
    const makeGame = (): Game => new Game([new Act2()])

    const mismatches = [
      ...staleSaveMismatches({
        makeGame,
        prepare,
        cases: [...OBJECT_CASES, ...QUEST_CASES],
      }),
      ...staleSaveMismatches({
        makeGame,
        prepare: prepareFinished,
        cases: QUEST_CASES,
      }).map((mismatch) => `${mismatch} (finished)`),
    ]

    expect(mismatches).toEqual([])
  })

  it('reads a room, character or item from its computed look, whatever an old save holds', () => {
    const { state } = new Game([new Act2()])
    for (const Target of COMPUTED_LOOKS) {
      const thing = new Target()
      const current = thing.descriptionFor(state)
      thing.description = 'old Thornfield wording'
      expect(thing.descriptionFor(state), Target.name).toBe(current)
    }
  })
})
