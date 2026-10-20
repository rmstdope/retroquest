import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { UnlockSpell } from './UnlockSpell'
import { Locker } from '../items/Locker'
import { PrismLantern } from '../items/PrismLantern'

describe('Act 3 Unlock spell', () => {
  it('returns a failure or unlock-like string on a locker', () => {
    const spell = new UnlockSpell()
    const game = new Game([new Act3()])
    const locker = new Locker()

    // Should return a failure unless lock is primed; ensure we get a string
    const out = spell.castOnItem(game.state, locker)

    expect(
      (out.includes('[') && out.toLowerCase().includes('failure')) ||
        out.toLowerCase().includes('click'),
    ).toBe(true)
  })

  it('returns a failure on a non-locker item', () => {
    const spell = new UnlockSpell()
    const game = new Game([new Act3()])
    const lantern = new PrismLantern()

    const out = spell.castOnItem(game.state, lantern)

    expect(out).toContain('[failure]')
  })
})
