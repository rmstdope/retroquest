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

  it('says plainly it will give no second fish once the first is gone', () => {
    const game = new Game([new Act1()])
    game.state.setStoryFlag('learned_fishing_basics', true)
    const river = new River()
    river.useWith(game.state, new FishingRod())
    game.state.removeItemFromInventory('fish')

    const result = river.useWith(game.state, new FishingRod())

    expect(result).not.toMatch(/right now/)
    expect(result).toContain('will not give another')
    expect(river.descriptionFor(game.state)).not.toMatch(/recently/)
    expect(river.descriptionFor(game.state)).toContain('will not give another')
    expect(game.state.inventory.some((item) => item instanceof Fish)).toBe(
      false,
    )
  })
})
