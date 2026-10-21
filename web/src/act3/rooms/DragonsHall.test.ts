import { GameState } from '@/engine'
import { FLAG_ACT3_DRAGONS_MEMORY_RECEIVED } from '../Act3StoryFlags'
import { describe, it, expect } from 'vitest'
import { DragonsHall } from './DragonsHall'
import { DragonsScale } from '../items/DragonsScale'
import { AncientDragon } from '../characters/AncientDragon'

describe("Dragon's Hall", () => {
  it('initializes with the dragon and without the scale', () => {
    const room = new DragonsHall()
    expect(room.name).toBe("Dragon's Hall")
    expect(room.description).toContain('Ancient Dragon')
  })

  it('has the agreed plain description', () => {
    expect(new DragonsHall().description).toBe(
      'A hall of living stone opens beyond sight, its ceiling lost in ' +
        'shadow. Embers burn slowly along the floor, pulsing like a heartbeat, ' +
        'and somewhere in the dark, water drips. Rings of old sigils spiral ' +
        'across the black tiles around the Ancient Dragon. It lies coiled at ' +
        'the centre, scales like polished obsidian, and each slow breath hums ' +
        'in your bones.',
    )
  })

  it('first mentions the dripping, so the later curse line refers back to it', () => {
    const room = new DragonsHall()
    const gs = new GameState(room, {}, [])
    gs.setStoryFlag(FLAG_ACT3_DRAGONS_MEMORY_RECEIVED, true)
    const text = room.descriptionFor(gs)
    expect(text.indexOf('water drips')).toBeGreaterThan(-1)
    expect(text.indexOf('water drips')).toBeLessThan(
      text.indexOf('The old dripping has stopped'),
    )
  })

  it('initializes without the scale and with the dragon', () => {
    const room = new DragonsHall()

    // Check items - dragon's scale should NOT be present initially
    const itemNames = room.items.map((item) => item.name)
    expect(itemNames).not.toContain("dragon's scale")

    // Check character
    expect(room.characters.some((c) => c instanceof AncientDragon)).toBe(true)
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
