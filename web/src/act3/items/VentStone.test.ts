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

  it("delegates to the room's calibration hook in the Fumarole Passages", () => {
    const stone = new VentStone()
    const room = new FumarolePassages()
    vi.spyOn(room, 'calibrateWithStone').mockReturnValue(
      '[event]You calibrate the vent with the stone.[/event]',
    )
    const gs = createState(room)

    const result = stone.use(gs)

    expect(room.calibrateWithStone).toHaveBeenCalledWith(gs, stone)
    expect(
      result.includes('calibrate the vent') || result.includes('vent'),
    ).toBe(true)
  })
})
