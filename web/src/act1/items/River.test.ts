import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act1 } from '../Act1'
import { Fish } from './Fish'
import { FishingRod } from './FishingRod'
import { River } from './River'

describe('River', () => {
  it('narrates the catch without naming the inventory', () => {
    const game = new Game([new Act1()])
    game.state.setStoryFlag('learned_fishing_basics', true)
    const result = new River().useWith(game.state, new FishingRod())

    expect(result).toContain('plump')
    expect(result).not.toMatch(/inventory/i)
    expect(game.state.inventory.some((item) => item instanceof Fish)).toBe(true)
  })
})
