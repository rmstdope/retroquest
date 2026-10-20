import { describe, it, expect, vi } from 'vitest'
import { GameState, Item, Room } from '@/engine'
import { HeatWardMix } from './HeatWardMix'
import { FumarolePassages } from '../rooms/FumarolePassages'

/** A bare game state in the given room. */
function createState(room: Room): GameState {
  return new GameState(room, {}, [])
}

/** The fumarole passages with its heat-ward hook replaced by a recording mock. */
function createFumaroleRoom(): FumarolePassages {
  const room = new FumarolePassages()
  vi.spyOn(room, 'applyHeatWard').mockReturnValue(
    '[event]You apply the heat-ward mix to the vents.[/event]',
  )
  return room
}

describe('HeatWardMix', () => {
  it('initializes with name, description and carry flag', () => {
    const mix = new HeatWardMix()

    expect(mix.name).toBe('heat-ward mix')
    expect(
      mix.description.includes('ash-fern') || mix.description.includes('slag'),
    ).toBe(true)
    expect(mix.canBeCarried).toBe(true)
  })

  it('fails when used with a non-room item', () => {
    const mix = new HeatWardMix()
    const gs = createState(new Room({ name: 'x', description: '' }))
    const item = new Item({ name: 'dummy item', description: '' })

    const result = mix.useWith(gs, item)

    expect(
      result.includes("can't use") ||
        result.includes('cannot use') ||
        result.toLowerCase().includes('not compatible'),
    ).toBe(true)
    expect(result).toContain('heat-ward mix')
    expect(result).toContain('dummy item')
  })

  it("delegates to the room's heat-ward hook when used with the room", () => {
    const mix = new HeatWardMix()
    const gs = createState(new Room({ name: 'x', description: '' }))
    const room = createFumaroleRoom()

    const result = mix.useWith(gs, room as unknown as Item)

    expect(room.applyHeatWard).toHaveBeenCalledWith(gs, mix)
    expect(
      result.includes('apply the heat-ward mix') || result.includes('vents'),
    ).toBe(true)
  })

  it('cannot be used in the wrong room', () => {
    const mix = new HeatWardMix()
    const gs = createState(
      new Room({ name: 'Not Fumarole Passages', description: '' }),
    )

    const result = mix.use(gs)

    expect(
      result.includes("can't use") || result.includes('usefully here'),
    ).toBe(true)
  })

  it("delegates to the room's heat-ward hook when used in the Fumarole Passages", () => {
    const mix = new HeatWardMix()
    const room = createFumaroleRoom()
    const gs = createState(room)

    const result = mix.use(gs)

    expect(room.applyHeatWard).toHaveBeenCalledWith(gs, mix)
    expect(
      result.includes('apply the heat-ward mix') || result.includes('vents'),
    ).toBe(true)
  })
})
