import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { MemoryOrbs } from './MemoryOrbs'
import { FLAG_ACT4_MEMORY_ORBS_MENDED } from '../Act4StoryFlags'
import { Act4 } from '../Act4'

const VERSE =
  'From the cracked one by the cradle a voice sings, low, "Hush, little seed—" and breaks off.'

describe('MemoryOrbs', () => {
  it('sings a broken-off verse before mending, and not after', () => {
    const game = new Game([new Act4()])
    const orbs = new MemoryOrbs()
    const before = orbs.examine(game.state)
    expect(before).toContain('before you can hold it. ' + VERSE)
    game.state.setStoryFlag(FLAG_ACT4_MEMORY_ORBS_MENDED, true)
    const after = orbs.examine(game.state)
    expect(after).not.toContain('Hush')
    expect(after).toContain('Whole now. In one, three young Wardens laugh')
  })

  it('answers to "orbs" and "memory orbs"', () => {
    expect(new MemoryOrbs().answersTo('orbs')).toBe(true)
    expect(new MemoryOrbs().answersTo('Memory Orbs')).toBe(true)
  })
})
