import { describe, it, expect } from 'vitest'
import { GameState, Room } from '@/engine'
import { VentStone } from './VentStone'

/** A bare game state in the given room. */
function createState(room: Room): GameState {
  return new GameState(room, {}, [])
}

describe('VentStone', () => {
  it('cannot be used in the wrong room', () => {
    const stone = new VentStone()
    const gs = createState(
      new Room({ name: 'Not Fumarole Passages', description: '' }),
    )

    const result = stone.use(gs)

    expect(
      result.includes("can't use") || result.includes('usefully here'),
    ).toBe(true)
  })
})
