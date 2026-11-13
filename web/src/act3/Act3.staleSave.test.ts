import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { staleSaveMismatches } from '@/testing/staleSave'
import { Act3 } from './Act3'
import { SirCedric } from './characters/SirCedric'
import { AncientAmulet } from './items/AncientAmulet'
import { CrystalOfLight } from './items/CrystalOfLight'
import { FortressGates } from './items/FortressGates'
import { HeatWardMix } from './items/HeatWardMix'
import { LifelightElixir } from './items/LifelightElixir'
import { StillwaterPhial } from './items/StillwaterPhial'
import { BreathOfTheMountain } from './quests/BreathOfTheMountain'
import { EchoesOfTheHiddenBondQuest } from './quests/EchoesOfTheHiddenBond'
import { LanternsOfTheDeepsQuest } from './quests/LanternsOfTheDeeps'
import { MirrorsOfEmberlightQuest } from './quests/MirrorsOfEmberlight'
import { TidewardSigilsQuest } from './quests/TidewardSigils'
import { CavernMouth } from './rooms/CavernMouth'
import { CollapsedGalleries } from './rooms/CollapsedGalleries'
import { CollapsedPier } from './rooms/CollapsedPier'
import { EchoChambers } from './rooms/EchoChambers'
import { EmberGallery } from './rooms/EmberGallery'
import { FortressEntrance } from './rooms/FortressEntrance'
import { FumarolePassages } from './rooms/FumarolePassages'
import { LowerSwitchbacks } from './rooms/LowerSwitchbacks'
import { MirasHut } from './rooms/MirasHut'
import { MirrorTerraces } from './rooms/MirrorTerraces'
import { ObsidianOutcrops } from './rooms/ObsidianOutcrops'
import { OuterWards } from './rooms/OuterWards'
import { PhoenixCrater } from './rooms/PhoenixCrater'
import { SanctumOfTheTide } from './rooms/SanctumOfTheTide'
import { ShorelineMarkers } from './rooms/ShorelineMarkers'
import { SubmergedAntechamber } from './rooms/SubmergedAntechamber'
import { TidalCauseway } from './rooms/TidalCauseway'
import { ToolCache } from './rooms/ToolCache'
import { BlessSpell } from './spells/BlessSpell'
import { LightSpell } from './spells/LightSpell'
import { MendSpell } from './spells/MendSpell'
import { PurifySpell } from './spells/PurifySpell'
import { UnlockSpell } from './spells/UnlockSpell'

/**
 * An Act III game carrying the items the cases check, with the quests whose
 * wording is refreshed finished: a quest not yet offered keeps the wording it
 * was saved with (see `SideQuestLogs.test.ts`).
 */
function prepare(game: Game): void {
  game.state.addItemToInventory(new HeatWardMix())
  game.state.addItemToInventory(new LifelightElixir())
  game.state.allRooms.SanctumOfTheTide.addItem(new CrystalOfLight())
  for (const quest of game.state.nonActivatedQuests) quest.completed = true
  game.state.settleFinishedQuests()
}

describe('Act III loading a save that holds old wording', () => {
  it('gives every object the current wording', () => {
    const mismatches = staleSaveMismatches({
      makeGame: () => new Game([new Act3()]),
      prepare,
      cases: [
        { target: MirasHut, fields: ['description'] },
        { target: CavernMouth, fields: ['description'] },
        { target: CollapsedGalleries, fields: ['description'] },
        { target: ToolCache, fields: ['description'] },
        { target: EchoChambers, fields: ['description'] },
        { target: OuterWards, fields: ['description'] },
        { target: SubmergedAntechamber, fields: ['description'] },
        { target: TidalCauseway, fields: ['description'] },
        { target: ShorelineMarkers, fields: ['description'] },
        { target: CollapsedPier, fields: ['description'] },
        { target: SanctumOfTheTide, fields: ['description'] },
        { target: LowerSwitchbacks, fields: ['description'] },
        { target: ObsidianOutcrops, fields: ['description'] },
        { target: MirrorTerraces, fields: ['description'] },
        { target: FumarolePassages, fields: ['description'] },
        { target: EmberGallery, fields: ['description'] },
        { target: PhoenixCrater, fields: ['description'] },
        { target: FortressEntrance, fields: ['description'] },
        { target: SirCedric, fields: ['name'] },
        { target: AncientAmulet, fields: ['description'] },
        { target: CrystalOfLight, fields: ['description'] },
        { target: HeatWardMix, fields: ['description'] },
        { target: StillwaterPhial, fields: ['description'] },
        { target: FortressGates, fields: ['description'] },
        { target: LifelightElixir, fields: ['description'] },
        { target: PurifySpell, fields: ['description'] },
        { target: UnlockSpell, fields: ['description'] },
        { target: LightSpell, fields: ['description'] },
        { target: MendSpell, fields: ['description'] },
        { target: BlessSpell, fields: ['description'] },
        { target: BreathOfTheMountain, fields: ['completion'] },
        { target: TidewardSigilsQuest, fields: ['description'] },
        {
          target: LanternsOfTheDeepsQuest,
          fields: ['description', 'completion'],
        },
        {
          target: MirrorsOfEmberlightQuest,
          fields: ['description', 'completion'],
        },
        { target: EchoesOfTheHiddenBondQuest, fields: ['completion'] },
      ],
    })

    expect(mismatches).toEqual([])
  })
})
