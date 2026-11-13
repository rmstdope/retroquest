import { describe, it, expect, vi } from 'vitest'
import { GameState, Room } from '@/engine'
import { VentStone } from './VentStone'
import { FumarolePassages } from '../rooms/FumarolePassages'

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

describe('VentStone room check', () => {
  it('is told the passages by class, not by name', () => {
    const stone = new VentStone()
    const room = new FumarolePassages()
    room.name = 'The Hissing Vents'
    const spy = vi.spyOn(room, 'calibrateWithStone').mockReturnValue('tuned')

    expect(stone.use(createState(room))).toBe('tuned')
    expect(spy).toHaveBeenCalled()
  })

  it('is not fooled by another room that borrows the name', () => {
    const room = new Room({ name: 'Fumarole Passages', description: '' })

    expect(new VentStone().use(createState(room))).toContain('usefully here')
  })
})
