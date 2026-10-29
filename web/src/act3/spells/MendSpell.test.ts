import { describe, it, expect, vi } from 'vitest'
import { Game, Item, type GameState } from '@/engine'
import { Act3 } from '../Act3'
import { MendSpell } from './MendSpell'
import { CharredInscription } from '../items/CharredInscription'
import { FLAG_ACT3_INSCRIPTION_MENDED } from '../Act3StoryFlags'
import { Sigils } from '../items/Sigils'
import { EchoStones } from '../items/EchoStones'
import { MirrorMount } from '../items/MirrorMount'
import { RustedLockerKey } from '../items/RustedLockerKey'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'

/** An Act III game state for the spell tests. */
function makeGameState(): GameState {
  return new Game([new Act3()]).state
}

/** An item that is not a MirrorMount. */
function makeDummyItem(): Item {
  return new Item({ name: 'dummy item', description: 'A dummy item.' })
}

describe('MendSpell', () => {
  it('initializes with name and description', () => {
    const spell = new MendSpell()
    expect(spell.name).toBe('mend')
    expect(spell.description).toContain('close what is cracked')
  })

  it('finds nothing to mend without a target', () => {
    const spell = new MendSpell()
    const result = spell.castSpell(makeGameState())
    expect(result).toContain('You cast')
    expect(result).toContain('nothing to mend')
  })

  it('does not mend a non-mirror-mount item', () => {
    const spell = new MendSpell()
    const result = spell.castOnItem(makeGameState(), makeDummyItem())
    expect(result).toContain("doesn't appear to need mending")
    expect(result).toContain('dummy item')
  })

  it('triggers mend on a MirrorMount and returns its success', () => {
    const spell = new MendSpell()
    const gs = makeGameState()
    const mount = new MirrorMount()
    const mend = vi
      .spyOn(mount, 'mend')
      .mockReturnValue(
        '[success]The mirror mount is now fully restored![/success]',
      )

    const result = spell.castOnItem(gs, mount)

    expect(mend).toHaveBeenCalledWith(gs)
    expect(result).toContain('fully restored')
  })

  it('uses known tags when the item needs no mending', () => {
    const answer = new MendSpell().castOnItem(
      makeGameState(),
      new RustedLockerKey(),
    )

    expect(answer).toContain("doesn't appear to need mending")
    expectMarkupWellFormed(answer)
  })

  it('mends the charred inscription through its receiveSpell hook', () => {
    const gs = makeGameState()
    const inscription = new CharredInscription()
    inscription.examine(gs)

    const answer = new MendSpell().castOnItem(gs, inscription)

    expect(answer).toContain('The deeper cut fills.')
    expect(gs.getStoryFlag(FLAG_ACT3_INSCRIPTION_MENDED)).toBe(true)
    expectMarkupWellFormed(answer)
  })

  it('leaves other items that react to spells with the generic reply', () => {
    for (const item of [new Sigils(), new EchoStones()]) {
      const answer = new MendSpell().castOnItem(makeGameState(), item)
      expect(answer).toContain("doesn't appear to need mending")
    }
  })
})
