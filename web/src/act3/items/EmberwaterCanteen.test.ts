import { describe, it, expect } from 'vitest'
import { GameState, Room } from '@/engine'
import { EmberwaterCanteen } from './EmberwaterCanteen'

/** A bare game state whose current room is empty. */
function createState(): GameState {
  return new GameState(new Room({ name: 'x', description: '' }), {}, [])
}

describe('EmberwaterCanteen', () => {
  it('initializes with name, description and carry flag', () => {
    const canteen = new EmberwaterCanteen()

    expect(canteen.name).toBe('Emberwater Canteen')
    expect(canteen.description.toLowerCase()).toContain('canteen')
    expect(canteen.canBeCarried).toBe(true)
  })

  it('adds a segment on the first examine only and updates the description', () => {
    const canteen = new EmberwaterCanteen()
    const gs = createState()

    const result = canteen.examine(gs)

    const found = gs.currentRoom.items.some(
      (i) => i.name === 'Brass Mirror Segment',
    )
    expect(found).toBe(true)
    expect(
      result.includes('pry free') || result.includes('falls to the ground'),
    ).toBe(true)

    const before = gs.currentRoom.items.length
    const result2 = canteen.examine(gs)
    const after = gs.currentRoom.items.length
    expect(after).toBe(before)
    expect(result2).not.toContain('pry free')
    expect(
      result2.includes("canteen's lining") || result2.includes('broth'),
    ).toBe(true)
  })
})
