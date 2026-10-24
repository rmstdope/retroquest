import { describe, it, expect } from 'vitest'
import { GameState, Item, Room } from '@/engine'
import { AshFern } from './AshFern'
import { CooledSlag } from './CooledSlag'

/** A bare game state with an empty inventory. */
function createState(): GameState {
  return new GameState(new Room({ name: 'x', description: '' }), {}, [])
}

describe('AshFern', () => {
  it('initializes with name, description and carry flag', () => {
    const ash = new AshFern()

    expect(ash.name).toBe('ash-fern')
    expect(ash.description).toContain('brittle frond')
    expect(ash.canBeCarried).toBe(true)
  })

  it('fails when used with a non-slag item', () => {
    const ash = new AshFern()
    const gs = createState()
    const other = new Item({ name: 'not slag', description: '' })

    const result = ash.useWith(gs, other)

    expect(result).toContain("can't use")
    expect(result).toContain('ash-fern')
    expect(result).toContain('not slag')
  })

  it('crafts a heat-ward mix with cooled slag and removes both items', () => {
    const ash = new AshFern()
    const gs = createState()
    const slag = new CooledSlag()
    gs.inventory = [ash, slag]

    const result = ash.useWith(gs, slag)

    expect(gs.inventory).not.toContain(ash)
    expect(gs.inventory).not.toContain(slag)
    const found = gs.inventory.some((i) => i.name === 'heat-ward mix')
    expect(found).toBe(true)
    expect(
      result.includes('heat-ward mix') || result.includes('heat-ward'),
    ).toBe(true)
    expect(result).toBe(
      'The ash-fern and cooled slag grind down into a coarse paste: a heat-ward mix.',
    )
  })
})
