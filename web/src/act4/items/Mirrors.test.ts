import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { Mirrors } from './Mirrors'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'

describe('Mirrors', () => {
  it('is scenery that tells of many false paths', () => {
    const game = new Game([new Act4()])
    const mirrors = new Mirrors()
    expect(mirrors.canBeCarried).toBe(false)
    const answer = mirrors.examine(game.state)
    expect(answer).toContain('Most of them are lies.')
    expectMarkupWellFormed(answer)
  })
})
