import { describe, it, expect } from 'vitest'
import { GameState, Room } from '@/engine'
import { FLAG_ACT3_OATH_SCROLLS_EXAMINED } from '../Act3StoryFlags'
import { OldOathScrolls } from './OldOathScrolls'

/** A bare game state in an empty room. */
function createState(): GameState {
  return new GameState(new Room({ name: 'x', description: '' }), {}, [])
}

describe('OldOathScrolls', () => {
  it('initializes with name, description and carry flag', () => {
    const scrolls = new OldOathScrolls()

    expect(scrolls.name).toBe('Old Oath Scrolls')
    expect(scrolls.canBeCarried).toBe(true)
    expect(scrolls.description).toContain('binding oaths')
    expect(scrolls.description).toContain('selflessness')
    expect(scrolls.description).toContain('Ancient Dragon')
  })

  it('sets the flag when examined', () => {
    const scrolls = new OldOathScrolls()
    const gs = createState()
    expect(gs.getStoryFlag(FLAG_ACT3_OATH_SCROLLS_EXAMINED)).toBe(false)

    const result = scrolls.examine(gs)

    expect(gs.getStoryFlag(FLAG_ACT3_OATH_SCROLLS_EXAMINED)).toBe(true)
    expect(result).toContain('binding oaths')
    expect(result).toContain('selflessness')
  })

  it('keeps the flag set when examined multiple times', () => {
    const scrolls = new OldOathScrolls()
    const gs = createState()

    scrolls.examine(gs)
    scrolls.examine(gs)
    scrolls.examine(gs)

    expect(gs.getStoryFlag(FLAG_ACT3_OATH_SCROLLS_EXAMINED)).toBe(true)
  })

  it('is removed from the room when examined', () => {
    const scrolls = new OldOathScrolls()
    const gs = createState()
    const room = gs.currentRoom
    room.items.push(scrolls)
    expect(room.items).toContain(scrolls)

    scrolls.examine(gs)

    expect(room.items).not.toContain(scrolls)
  })
})
