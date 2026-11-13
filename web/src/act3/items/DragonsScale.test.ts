import { describe, it, expect } from 'vitest'
import { GameState, Room } from '@/engine'
import { FLAG_ACT3_DRAGONS_SCALE_ACQUIRED } from '../Act3StoryFlags'
import { DragonsScale } from './DragonsScale'

/** A bare game state with no flags and an empty inventory. */
function createState(): GameState {
  return new GameState(new Room({ name: 'x', description: '' }), {}, [])
}

describe('DragonsScale', () => {
  it('is picked up with all prerequisites', () => {
    const scale = new DragonsScale()
    const gs = createState()
    gs.inventory.push(scale)

    const result = scale.pickedUp(gs)

    expect(result).toBe(
      'The scale is cold, and heavier than it looks. ' +
        'You take its weight in both hands.',
    )
    expect(gs.inventory).toContain(scale)
    expect(gs.getStoryFlag(FLAG_ACT3_DRAGONS_SCALE_ACQUIRED)).toBe(true)
  })
})
