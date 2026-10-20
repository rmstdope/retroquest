import { describe, it, expect, vi } from 'vitest'
import { GameState, Item, Room } from '@/engine'
import { BrassMirrorSegment } from './BrassMirrorSegment'
import { MirrorMount } from './MirrorMount'

/** A bare game state with an empty inventory. */
function createState(): GameState {
  return new GameState(new Room({ name: 'x', description: '' }), {}, [])
}

describe('BrassMirrorSegment', () => {
  it('initializes with name, description and carry flag', () => {
    const seg = new BrassMirrorSegment()

    expect(seg.name.toLowerCase()).toBe('brass mirror segment')
    expect(seg.description.toLowerCase()).toContain('brass segment')
    expect(seg.canBeCarried).toBe(true)
  })

  it('fails when used with a non-mount item', () => {
    const seg = new BrassMirrorSegment()
    const gs = createState()
    const item = new Item({ name: 'dummy item', description: '' })

    const result = seg.useWith(gs, item)

    expect(
      result.includes("can't use") ||
        result.includes('cannot use') ||
        result.toLowerCase().includes('not compatible'),
    ).toBe(true)
  })

  it('delegates to the mirror mount when used with it', () => {
    const seg = new BrassMirrorSegment()
    const gs = createState()
    const mount = new MirrorMount()
    const useWith = vi
      .spyOn(mount, 'useWith')
      .mockReturnValue('[event]You install the segment in the mount.[/event]')

    const result = seg.useWith(gs, mount)

    expect(useWith).toHaveBeenCalledWith(gs, seg)
    expect(
      result.includes('install the segment') ||
        result.toLowerCase().includes('segment'),
    ).toBe(true)
  })
})
