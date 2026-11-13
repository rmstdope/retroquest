import { GameState } from '@/engine'
import { FLAG_ACT3_DRAGONS_MEMORY_RECEIVED } from '../Act3StoryFlags'
import { describe, it, expect } from 'vitest'
import { DragonsHall } from './DragonsHall'
import { DragonsScale } from '../items/DragonsScale'

describe("Dragon's Hall", () => {
  it('says water drips before the curse has shown itself', () => {
    const room = new DragonsHall()
    const gs = new GameState(room, {}, [])
    const text = room.descriptionFor(gs)
    expect(text).toContain('water drips')
    expect(text).not.toContain('The old dripping has stopped')
  })

  it('no longer says water drips once the dripping has stopped', () => {
    const room = new DragonsHall()
    const gs = new GameState(room, {}, [])
    gs.setStoryFlag(FLAG_ACT3_DRAGONS_MEMORY_RECEIVED, true)
    expect(room.descriptionFor(gs)).toBe(
      'A hall of living stone opens beyond sight, its ceiling lost in ' +
        'shadow. Embers burn slowly along the floor, pulsing like a ' +
        'heartbeat. Rings of old sigils spiral across the black tiles around ' +
        'the Ancient Dragon. It lies coiled at the centre, scales like ' +
        'polished obsidian, and each slow breath hums in your bones. ' +
        'The old dripping has stopped; from the mines beyond comes no sound ' +
        'of picks at all.',
    )
  })

  it('exits west to the Stillness Vestibule', () => {
    const room = new DragonsHall()
    const exits = room.exits

    expect(exits).toHaveProperty('west')
    expect(exits.west).toBe('StillnessVestibule')
  })

  it("does not hold the dragon's scale initially", () => {
    const room = new DragonsHall()

    // Dragon's scale should not be present initially
    const dragonsScale = room.items.find((item) => item instanceof DragonsScale)

    expect(dragonsScale).toBeUndefined()
  })

  it("accepts the dragon's scale added dynamically", () => {
    const room = new DragonsHall()

    // Initially no dragon's scale
    expect(room.items.some((item) => item instanceof DragonsScale)).toBe(false)

    // Add dragon's scale
    const dragonsScale = new DragonsScale()
    room.addItem(dragonsScale)

    // Now it should be present
    expect(room.items.some((item) => item instanceof DragonsScale)).toBe(true)
    expect(dragonsScale.canBeCarried).toBe(true)
  })
})
