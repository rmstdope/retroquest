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
    expect(scrolls.description).toContain('Brittle parchment')
    expect(scrolls.description).toContain(
      'I take what is given, and I return ___.',
    )
  })

  it('sets the flag when examined', () => {
    const scrolls = new OldOathScrolls()
    const gs = createState()
    expect(gs.getStoryFlag(FLAG_ACT3_OATH_SCROLLS_EXAMINED)).toBe(false)

    const result = scrolls.examine(gs)

    expect(gs.getStoryFlag(FLAG_ACT3_OATH_SCROLLS_EXAMINED)).toBe(true)
    expect(result).toContain('I take what is given, and I return ___.')
    expect(result).not.toContain('disintegrate')
  })

  it('keeps the flag set when examined multiple times', () => {
    const scrolls = new OldOathScrolls()
    const gs = createState()

    scrolls.examine(gs)
    scrolls.examine(gs)
    scrolls.examine(gs)

    expect(gs.getStoryFlag(FLAG_ACT3_OATH_SCROLLS_EXAMINED)).toBe(true)
  })

  it('stays in the room and the bag when examined, with the same text', () => {
    const scrolls = new OldOathScrolls()
    const gs = createState()
    gs.currentRoom.items.push(scrolls)
    gs.inventory.push(scrolls)

    const first = scrolls.examine(gs)
    const second = scrolls.examine(gs)

    expect(gs.currentRoom.items).toContain(scrolls)
    expect(gs.inventory).toContain(scrolls)
    expect(second).toBe(first)
  })
})
