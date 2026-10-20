import { describe, it, expect } from 'vitest'
import { GameState, Room } from '@/engine'
import { FLAG_ACT3_DRAGONS_SCALE_ACQUIRED } from '../Act3StoryFlags'
import { DragonsScale } from './DragonsScale'

/** A bare game state with no flags and an empty inventory. */
function createState(): GameState {
  return new GameState(new Room({ name: 'x', description: '' }), {}, [])
}

describe('DragonsScale', () => {
  it('initializes with name, description and carry flag', () => {
    const scale = new DragonsScale()

    expect(scale.name).toBe("Dragon's Scale")
    expect(scale.description).toContain('dark as midnight')
    expect(scale.description).toContain('deep gold')
    expect(scale.canBeCarried).toBe(true)
  })

  it('is picked up with all prerequisites', () => {
    const scale = new DragonsScale()
    const gs = createState()
    gs.inventory.push(scale)

    const result = scale.pickedUp(gs).toLowerCase()

    expect(result).toContain('settles into your hands')
    expect(result).toContain('burden of responsibility')
    expect(result).toContain('pulses warmly')
    expect(gs.inventory).toContain(scale)
    expect(gs.getStoryFlag(FLAG_ACT3_DRAGONS_SCALE_ACQUIRED)).toBe(true)
  })
})
