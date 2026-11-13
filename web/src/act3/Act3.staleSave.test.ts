import { describe, it, expect } from 'vitest'
import { Game, type Character, type Item, type Room } from '@/engine'
import { staleSaveMismatches } from '@/testing/staleSave'
import { Act3 } from './Act3'
import { SirCedric } from './characters/SirCedric'
import { AncientAmulet } from './items/AncientAmulet'
import { CrystalOfLight } from './items/CrystalOfLight'
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
        { target: SirCedric, fields: ['name'] },
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

/** Something the game describes from the state: `descriptionFor` is the one method that does. */
type Described = Room | Item | Character

describe('Act III loading a save that holds an old saved description', () => {
  it('describes every object with the current wording', () => {
    const targets: (abstract new (...args: never[]) => Described)[] = [
      MirasHut,
      CavernMouth,
      CollapsedGalleries,
      ToolCache,
      EchoChambers,
      OuterWards,
      SubmergedAntechamber,
      TidalCauseway,
      ShorelineMarkers,
      CollapsedPier,
      SanctumOfTheTide,
      LowerSwitchbacks,
      ObsidianOutcrops,
      MirrorTerraces,
      FumarolePassages,
      EmberGallery,
      PhoenixCrater,
      FortressEntrance,
      AncientAmulet,
      CrystalOfLight,
      HeatWardMix,
      StillwaterPhial,
      LifelightElixir,
      SirCedric,
    ]
    const find = (game: Game, target: (typeof targets)[number]): Described => {
      const state = game.state
      const rooms = Object.values(state.allRooms)
      const all: Described[] = [
        ...rooms,
        ...rooms.flatMap((room) => room.items),
        ...rooms.flatMap((room) => room.characters),
        ...state.inventory,
      ]
      const found = all.find((object) => object instanceof target)
      if (!found) throw new Error(`${target.name} is not in the game`)
      return found
    }
    const fresh = new Game([new Act3()])
    prepare(fresh)
    const source = new Game([new Act3()])
    prepare(source)
    for (const target of targets) find(source, target).description = 'STALE'
    const loaded = new Game([new Act3()])
    loaded.loadSaveData(source.toSaveData())

    const mismatches = targets
      .filter(
        (target) =>
          find(loaded, target).descriptionFor(loaded.state) !==
          find(fresh, target).descriptionFor(fresh.state),
      )
      .map((target) => target.name)
    expect(mismatches).toEqual([])
  })
})
