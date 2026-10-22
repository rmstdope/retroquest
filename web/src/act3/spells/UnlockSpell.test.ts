import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { UnlockSpell } from './UnlockSpell'
import { Locker } from '../items/Locker'
import { SupplyCrate } from '../items/SupplyCrate'
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

  it('opens the supply crate without the key, and says so once it is open', () => {
    const game = new Game([new Act3()])
    const crate = new SupplyCrate()

    const first = new UnlockSpell().castOnItem(game.state, crate)
    const again = new UnlockSpell().castOnItem(game.state, crate)

    expect(first).toContain('The lock falls open.')
    expect(crate.locked).toBe(false)
    expect(again).toContain('The padlock already hangs open.')
    expect(crate.open(game.state)).toContain('You open the crate.')
  })

  it('returns a failure on a non-locker item', () => {
    const spell = new UnlockSpell()
    const game = new Game([new Act3()])
    const lantern = new PrismLantern()

    const out = spell.castOnItem(game.state, lantern)

    expect(out).toContain('[failure]')
  })
})
