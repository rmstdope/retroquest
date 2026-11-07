import { describe, it, expect } from 'vitest'
import { GameState, Room } from '@/engine'
import {
  FLAG_ACT3_DRAGONS_SCALE_ACQUIRED,
  FLAG_ACT3_SIGILS_MENDED,
} from '../Act3StoryFlags'
import { Sigils } from './Sigils'

/** A bare game state with no flags and an empty inventory. */
function createState(): GameState {
  return new GameState(new Room({ name: 'x', description: '' }), {}, [])
}

describe('Sigils', () => {
  it("reads as the dragon's prison before the scale is taken", () => {
    const text = new Sigils().examine(createState())

    expect(text).toContain('prison')
    expect(text).not.toContain('forgotten civilizations')
    expect(text).not.toContain('crack')
  })

  it('shows the cracked ring once the scale is taken', () => {
    const gs = createState()
    gs.setStoryFlag(FLAG_ACT3_DRAGONS_SCALE_ACQUIRED, true)

    const text = new Sigils().examine(gs)

    expect(text).toContain('hairline crack runs through the nearest ring')
    expect(text).toContain('prison')
  })

  it('shows the ring whole again once the sigils are mended', () => {
    const gs = createState()
    gs.setStoryFlag(FLAG_ACT3_DRAGONS_SCALE_ACQUIRED, true)
    gs.setStoryFlag(FLAG_ACT3_SIGILS_MENDED, true)

    const text = new Sigils().examine(gs)

    expect(text).toContain('steady and whole')
    expect(text).not.toContain('crack')
  })
})
