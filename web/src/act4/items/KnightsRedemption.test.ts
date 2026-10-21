import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { KnightsRedemption } from './KnightsRedemption'

describe('KnightsRedemption', () => {
  it('can be carried and examined', () => {
    const game = new Game([new Act4()])
    const badge = new KnightsRedemption()
    expect(badge.canBeCarried).toBe(true)
    expect(badge.examine(game.state)).toContain(
      "proof that even one of Malakar's own can turn back.",
    )
  })
})
