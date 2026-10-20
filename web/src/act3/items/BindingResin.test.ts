import { describe, it, expect, vi } from 'vitest'
import { GameState, Item, Room } from '@/engine'
import { BindingResin } from './BindingResin'
import { MirrorMount } from './MirrorMount'

/** A bare game state with an empty inventory. */
function createState(): GameState {
  return new GameState(new Room({ name: 'x', description: '' }), {}, [])
}

describe('BindingResin', () => {
  it('initializes with name, description and carry flag', () => {
    const resin = new BindingResin()

    expect(resin.name.toLowerCase()).toBe('binding resin')
    expect(
      resin.description.includes('sticky') ||
        resin.description.toLowerCase().includes('resin'),
    ).toBe(true)
    expect(resin.canBeCarried).toBe(true)
  })

  it('fails when used with a non-mount item', () => {
    const resin = new BindingResin()
    const gs = createState()
    const item = new Item({ name: 'dummy item', description: '' })

    const result = resin.useWith(gs, item)

    expect(
      result.includes("can't use") ||
        result.includes('cannot use') ||
        result.toLowerCase().includes('not compatible'),
    ).toBe(true)
  })

  it('delegates to the mirror mount when used with it', () => {
    const resin = new BindingResin()
    const gs = createState()
    const mount = new MirrorMount()
    const useWith = vi
      .spyOn(mount, 'useWith')
      .mockReturnValue(
        '[event]You apply the resin to the mirror mount.[/event]',
      )

    const result = resin.useWith(gs, mount)

    expect(useWith).toHaveBeenCalledWith(gs, resin)
    expect(
      result.includes('apply the resin') ||
        result.toLowerCase().includes('resin'),
    ).toBe(true)
  })
})
