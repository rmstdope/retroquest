import { describe, it, expect } from 'vitest'
import { GameState, Room } from '@/engine'
import { EmberGallery } from './EmberGallery'

/** A bare game state (the Python DummyGameState). */
function dummyState(): GameState {
  return new GameState(new Room({ name: 'Nowhere', description: '' }), {}, [])
}

describe('Ember Gallery', () => {
  it('initializes empty with north and west exits', () => {
    const room = new EmberGallery()
    expect(room.name).toBe('Ember Gallery')
    expect(
      room.description.includes('charcoal') ||
        room.description.includes('iron'),
    ).toBe(true)
    expect(room.exits).toHaveProperty('north')
    expect(room.exits).toHaveProperty('west')
    expect(room.items).toEqual([])
    expect(room.characters).toEqual([])
  })

  it('reveals the deposits only on the first search', () => {
    const room = new EmberGallery()
    const gs = dummyState()
    const result = room.search(gs)
    // Should add AshFern and CooledSlag to items
    const names = room.items.map((i) => i.name)
    expect(names.some((n) => n.includes('ash-fern'))).toBe(true)
    expect(names.some((n) => n.includes('cooled slag'))).toBe(true)
    expect(
      result.includes('brittle frond') || result.includes('ash-fern'),
    ).toBe(true)
    expect(result).toContain('cooled slag')
    // Should not reveal again
    const result2 = room.search(gs)
    expect(
      result2.includes('find nothing new') || result2.includes('worktables'),
    ).toBe(true)
    // Items should not be duplicated
    expect(room.items.map((i) => i.name)).toEqual(names)
  })
})
