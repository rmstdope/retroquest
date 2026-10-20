import { describe, it, expect } from 'vitest'
import { GameState, Room } from '@/engine'
import { PhoenixCrater } from './PhoenixCrater'

/** A bare game state (the Python DummyGameState). */
function dummyState(): GameState {
  return new GameState(new Room({ name: 'Nowhere', description: '' }), {}, [])
}

function phoenixCount(room: Room): number {
  return room.characters.filter((c) => c.name.toLowerCase() === 'phoenix')
    .length
}

describe('Phoenix Crater', () => {
  it('initializes empty with a north exit', () => {
    const room = new PhoenixCrater()
    expect(room.name).toBe('Phoenix Crater')
    expect(
      room.description.includes('vitrified rock') ||
        room.description.includes('crater'),
    ).toBe(true)
    expect(room.exits).toHaveProperty('north')
    expect(room.items).toEqual([])
    expect(room.characters).toEqual([])
  })

  it('reveals the Phoenix only once when resting', () => {
    const room = new PhoenixCrater()
    const gs = dummyState()
    // First rest: should add Phoenix and update description
    const result = room.rest(gs)
    expect(phoenixCount(room)).toBeGreaterThan(0)
    expect(
      result.includes('phoenix of living ember') ||
        result.includes('ancient, knowing patience'),
    ).toBe(true)
    expect(
      room.description.includes('molten fan') ||
        room.description.includes('plumage'),
    ).toBe(true)
    // Second rest: should not add another Phoenix
    const prevCount = phoenixCount(room)
    const result2 = room.rest(gs)
    expect(phoenixCount(room)).toBe(prevCount)
    expect(result2).toContain('gathering your strength')
  })
})
