import { describe, it, expect } from 'vitest'
import { Game, type GameState } from '@/engine'
import { parseTurn, type TurnBlock } from '@/lantern/parseTurn'
import { Act4 } from '../Act4'
import {
  FLAG_ACT4_ELIXIR_ON_KING,
  FLAG_ACT4_FORGIVENESS_SAID,
  FLAG_ACT4_JUSTICE_SAID,
  FLAG_ACT4_SACRIFICE_SAID,
  FLAG_ACT4_SHADOW_OF_THE_PAST_COMPLETED,
  FLAG_ACT4_THRONE_AMULET_OPENED,
  FLAG_ACT4_TOWER_STAIR_OPEN,
} from '../Act4StoryFlags'
import { AncientAmulet } from './AncientAmulet'
import { Banners } from './Banners'
import { Barriers } from './Barriers'
import { CrystalPrison } from './CrystalPrison'
import { CrystalWhispers } from './CrystalWhispers'
import { EchoStone } from './EchoStone'
import { Echoes } from './Echoes'
import { GuardiansChain } from './GuardiansChain'
import { GuardiansEssence } from './GuardiansEssence'
import { KnightsRedemption } from './KnightsRedemption'
import { LifelightElixir } from './LifelightElixir'
import { LoyaltyToken } from './LoyaltyToken'
import { Memories } from './Memories'
import { MemoryOrbs } from './MemoryOrbs'
import { Mirrors } from './Mirrors'
import { ServantsPendant } from './ServantsPendant'
import { SorceressStaff } from './SorceressStaff'
import { SorceressTruth } from './SorceressTruth'
import { VaultDoor } from './VaultDoor'
import { WardStone } from './WardStone'
import { WardStoneFragment } from './WardStoneFragment'
import { WardStones } from './WardStones'
import { Wound } from './Wound'

/** A fresh Act IV game standing in the named room. */
function inRoom(room: string): GameState {
  const act = new Act4()
  act.musicFile = ''
  const game = new Game([act])
  game.state.currentRoom = game.state.allRooms[room]
  return game.state
}

/** The blocks of an answer that are not plain story text or dialogue. */
function nonText(answer: string): TurnBlock[] {
  return parseTurn(answer).filter(
    (block) => block.kind !== 'text' && block.kind !== 'dialogue',
  )
}

describe('Act IV items narrate their effect', () => {
  it('reads every description as story text, never a grey event line', () => {
    const state = inRoom('HallOfEchoes')
    const items = [
      new Memories(),
      new VaultDoor(),
      new WardStone('left'),
      new WardStone('right'),
      new WardStones(),
      new Barriers(),
      new Mirrors(),
      new Banners(),
      new MemoryOrbs(),
      new Echoes(),
      new SorceressStaff(),
      new SorceressTruth(),
      new KnightsRedemption(),
      new LifelightElixir(),
      new CrystalPrison(),
      new CrystalWhispers(),
      new Wound(),
      new AncientAmulet(),
      new EchoStone(),
    ]
    for (const item of items) {
      expect(nonText(item.examine(state)), item.name).toEqual([])
      expect(parseTurn(item.examine(state)).length, item.name).toBeGreaterThan(
        0,
      )
    }
  })

  it('reads the pick-up lines of the fragment and the chain without repeating the pick-up', () => {
    const state = inRoom('HallOfEchoes')

    expect(parseTurn(new WardStoneFragment().pickedUp(state))).toEqual([
      {
        kind: 'text',
        markup: 'The fragment is cold, and it no longer keeps any time at all.',
      },
    ])
    expect(parseTurn(new GuardiansChain().pickedUp(state))).toEqual([
      {
        kind: 'text',
        markup:
          'A surge of protective energy courses through your body. The ' +
          "chain's light grows brighter, recognizing you as its new bearer.",
      },
    ])
  })

  it('folds the chain, essence, token, stone, badge and pendant answers into read sentences', () => {
    const hall = inRoom('HallOfEchoes')
    expect(parseTurn(new GuardiansChain().use(hall))).toEqual([
      {
        kind: 'text',
        markup:
          "The chain's crystals catch what little light there is and keep " +
          'it. His sorrow is still there, but it no longer reaches you.',
      },
    ])
    expect(nonText(new GuardiansChain().use(inRoom('FortressGates')))).toEqual(
      [],
    )

    const courtyard = inRoom('OuterCourtyard')
    const essence = new GuardiansEssence().useOnCharacter(
      courtyard,
      courtyard.currentRoom.characters[0],
    )
    expect(essence).toContain(
      'The servants stop their circling and gather to look at the [item_name]' +
        "Guardian's Essence[/item_name]. One reaches out, but does not touch.",
    )
    expect(essence).not.toContain('You hold out')
    expect(nonText(essence)).toEqual([])

    const tower = inRoom('TowerOfShadows')
    const token = new LoyaltyToken().use(tower)
    expect(token).toMatch(
      /^The token grows warm in your hand\. Under the whispers/,
    )
    expect(nonText(token)).toEqual([])
    tower.setStoryFlag(FLAG_ACT4_TOWER_STAIR_OPEN, true)

    const outside = EchoStone.useInRoom(inRoom('FortressGates'))
    expect(outside).toMatch(
      /^The hall's voices murmur inside the Echo Stone, waiting for somewhere that needs them\./,
    )
    expect(nonText(outside)).toEqual([])
    const enhanced = new EchoStone()
    enhanced.enhance()
    expect(parseTurn(enhanced.use(inRoom('FortressGates')))).toEqual([
      {
        kind: 'text',
        markup:
          'The voices inside the stone are clearer now, waiting for a place ' +
          'where memories sleep.',
      },
    ])

    const chamber = inRoom('ChamberOfWhispers')
    const badge = new KnightsRedemption().use(chamber)
    expect(badge).toMatch(
      /^The Sorceress stares at the knight's badge, and for the first time her smile slips\./,
    )
    expect(nonText(badge)).toEqual([])
    expect(parseTurn(badge).at(-1)?.kind).toBe('text')

    expect(nonText(new ServantsPendant().use(courtyard))).toEqual([])
    expect(nonText(new GuardiansEssence().use(courtyard))).toEqual([])
    expect(nonText(new SorceressTruth().use(courtyard))).toEqual([])
    expect(new SorceressTruth().use(courtyard)).toMatch(
      /^Somewhere ahead is someone who needs to see/,
    )
  })

  it('reads the elixir freeing the king and the sacrifice, and keeps the amulet scenes bare', () => {
    const throne = inRoom('ThroneChamber')
    const freed = new CrystalPrison().breakWith(throne)
    expect(freed).toMatch(
      /^Under the elixir the crystal cracks like ice in spring/,
    )
    expect(nonText(freed)).toEqual([])
    expect(freed).toContain('The Lifelight Elixir is gone.')

    const forgiving = inRoom('ThroneChamber')
    forgiving.setStoryFlag(FLAG_ACT4_FORGIVENESS_SAID, true)
    const forgiven = new Wound().forgive(forgiving)
    expect(forgiven).toMatch(
      /^Forgiveness settles on the wound, and its edges stop flickering\. The days that never happened fall quiet one by one,/,
    )
    expect(forgiven).not.toContain('You lay forgiveness')

    const justice = inRoom('ThroneChamber')
    justice.setStoryFlag(FLAG_ACT4_ELIXIR_ON_KING, true)
    justice.setStoryFlag(FLAG_ACT4_JUSTICE_SAID, true)
    expect(new Wound().closeWithAmulet(justice)).toMatch(
      /^You press the open amulet to the wound\./,
    )

    const sacrifice = inRoom('ThroneChamber')
    sacrifice.setStoryFlag(FLAG_ACT4_ELIXIR_ON_KING, true)
    sacrifice.setStoryFlag(FLAG_ACT4_SACRIFICE_SAID, true)
    const gone = new Wound().closeWithAmulet(sacrifice)
    expect(parseTurn(gone).some((b) => b.kind === 'event')).toBe(false)
    expect(gone).toContain('Your magic is gone. Only grow remains.')
  })

  it('opens the vault door with a read line', () => {
    const state = inRoom('MemoryVault')
    state.setStoryFlag(FLAG_ACT4_SHADOW_OF_THE_PAST_COMPLETED, true)
    expect(nonText(new VaultDoor().openWith(state))).toEqual([])
  })

  it('reads the red boxes that say something and keeps no bare no among the items', () => {
    const early = inRoom('MemoryVault')
    expect(parseTurn(new VaultDoor().openWith(early))).toEqual([
      {
        kind: 'failure',
        narrated: true,
        markup:
          "The door's runes stay dark under the amulet. Something in this " +
          'vault is not ready to let you in.',
      },
    ])

    const throne = inRoom('ThroneChamber')
    expect(parseTurn(new Wound().closeWithAmulet(throne))).toEqual([
      {
        kind: 'failure',
        narrated: true,
        markup:
          'Not yet. The wound is not yours to close while Malakar still ' +
          'waits for you.',
      },
    ])
    expect(parseTurn(new Wound().forgive(throne))).toEqual([
      {
        kind: 'failure',
        narrated: true,
        markup: 'Forgiveness has not been spoken yet.',
      },
    ])
    throne.setStoryFlag(FLAG_ACT4_THRONE_AMULET_OPENED, true)
    expect(
      parseTurn(new LifelightElixir().useWith(throne, new Mirrors())),
    ).toEqual([
      {
        kind: 'failure',
        narrated: true,
        markup: "The elixir is for the king's prison, or for Malakar's wound.",
      },
    ])
  })
})
