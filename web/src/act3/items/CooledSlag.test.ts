import { describe, it, expect } from 'vitest'
import { GameState, Item, Room } from '@/engine'
import { CooledSlag } from './CooledSlag'
import { AshFern } from './AshFern'

/** A bare game state with an empty inventory. */
function createState(): GameState {
  return new GameState(new Room({ name: 'x', description: '' }), {}, [])
}

describe('CooledSlag', () => {
  it('initializes with name, description and carry flag', () => {
    const slag = new CooledSlag()

    expect(slag.name).toBe('cooled slag')
    expect(
      slag.description.includes('glassy') ||
        slag.description.toLowerCase().includes('slag'),
    ).toBe(true)
    expect(slag.canBeCarried).toBe(true)
  })

  it('fails when used with a non-ash-fern item', () => {
    const slag = new CooledSlag()
    const gs = createState()
    const item = new Item({ name: 'dummy item', description: '' })

    const result = slag.useWith(gs, item)

    expect(
      result.includes("can't use") ||
        result.includes('cannot use') ||
        result.toLowerCase().includes('not compatible'),
    ).toBe(true)
    expect(result).toContain('cooled slag')
    expect(result).toContain('dummy item')
  })

  it('crafts a heat-ward mix with ash-fern and updates the inventory', () => {
    const slag = new CooledSlag()
    const gs = createState()
    const ash = new AshFern()
    gs.inventory = [ash, slag]

    const result = slag.useWith(gs, ash)

    expect(gs.inventory).not.toContain(ash)
    expect(gs.inventory).not.toContain(slag)
    const found = gs.inventory.some((i) => i.name === 'heat-ward mix')
    expect(found).toBe(true)
    expect(
      result.includes('heat-ward mix') || result.includes('heat-ward'),
    ).toBe(true)
  })
})
