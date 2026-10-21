import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { SorceressTruth } from './SorceressTruth'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'

describe('SorceressTruth', () => {
  it('can be carried, examined and used anywhere', () => {
    const game = new Game([new Act4()])
    const item = new SorceressTruth()
    expect(item.name).toBe("Sorceress's Truth")
    expect(item.canBeCarried).toBe(true)
    for (const text of [item.examine(game.state), item.use(game.state)]) {
      expectMarkupWellFormed(text)
    }
    expect(item.examine(game.state)).toContain('a lie she no longer needs')
    expect(item.use(game.state)).toContain('a liar can choose the truth')
  })
})
