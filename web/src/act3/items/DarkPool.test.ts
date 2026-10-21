import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { FLAG_ACT3_POOLS_STILLED } from '../Act3StoryFlags'
import { DarkPool } from './DarkPool'
import { QuietCharm } from './QuietCharm'
import { StillwaterPhial } from './StillwaterPhial'

describe('DarkPool', () => {
  it('answers to pool and pools', () => {
    const pool = new DarkPool()
    expect(pool.answersTo('pool')).toBe(true)
    expect(pool.answersTo('Pools')).toBe(true)
    expect(pool.answersTo('dark pool')).toBe(true)
    expect(pool.answersTo('stones')).toBe(false)
    expect(pool.canBeCarried).toBe(false)
  })

  it('shows the tremor before stilling and the mirror after, word for word', () => {
    const game = new Game([new Act3()])
    const pool = new DarkPool()
    expect(pool.examine(game.state)).toContain(
      'Obsidian water, so still it seems frozen. Yet when you lean close, ' +
        'the faintest tremor runs across it, too fine to see unless you are ' +
        'looking for it.',
    )
    game.state.setStoryFlag(FLAG_ACT3_POOLS_STILLED, true)
    expect(pool.examine(game.state)).toContain(
      'The water lies flat as glass, holding the stones and the dark above ' +
        'in perfect reflection. Not a tremor crosses it.',
    )
  })

  it('stills with the phial from either side and refuses other items', () => {
    const game = new Game([new Act3()])
    const pool = new DarkPool()
    expect(pool.useWith(game.state, new StillwaterPhial())).toContain(
      'The pools are mirror-still. Now the chant will carry.',
    )
    expect(game.state.getStoryFlag(FLAG_ACT3_POOLS_STILLED)).toBe(true)
    expect(pool.useWith(game.state, new QuietCharm())).toContain(
      "You can't use",
    )
  })
})
