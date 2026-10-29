import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { PurifySpell } from './PurifySpell'
import { UnlockSpell } from './UnlockSpell'
import { LightSpell } from './LightSpell'
import { MendSpell } from './MendSpell'
import { BlessSpell } from './BlessSpell'

/** The agreed description of each Act III spell, by spell id. */
const EXPECTED: Record<string, string> = {
  purify:
    'Your mother taught it to the fisherman at the bend, and he gave it ' +
    'back to you. It makes foul water clean.',
  unlock: 'The second thing Mira showed you: how to open.',
  light: 'The third thing Mira showed you: how to make a light.',
  mend:
    'The old woman at the end bench in Greendale taught you over a split ' +
    'bowl: close what is cracked, slowly.',
  bless:
    "The blessing the priest said over you when you found the founders' " +
    'locket.',
}

describe('Act III spell descriptions remember who taught the spell', () => {
  const spells = [
    new PurifySpell(),
    new UnlockSpell(),
    new LightSpell(),
    new MendSpell(),
    new BlessSpell(),
  ]
  for (const spell of spells) {
    it(`${spell.id} names its teacher`, () => {
      expect(spell.description).toBe(EXPECTED[spell.id])
    })
  }

  it('bless on yourself speaks of the priest', () => {
    const game = new Game([new Act3()])
    expect(new BlessSpell().castSpell(game.state)).toBe(
      "A quiet warmth settles on your shoulders and stays, the way the priest's hand did.",
    )
  })

  it('an older save shows the new wording after loading', () => {
    const game = new Game([new Act3()])
    for (const spell of game.state.knownSpells) spell.description = 'Old.'
    const fresh = new Game([new Act3()])
    fresh.loadSaveData(game.toSaveData())
    for (const spell of fresh.state.knownSpells) {
      if (spell.id in EXPECTED) {
        expect(spell.description).toBe(EXPECTED[spell.id])
      }
    }
    expect(
      fresh.state.knownSpells.filter((s) => s.id in EXPECTED).length,
    ).toBeGreaterThanOrEqual(3)
  })
})
