import { describe, it, expect } from 'vitest'
import { DragonsHall } from './DragonsHall'
import { DragonsScale } from '../items/DragonsScale'
import { AncientDragon } from '../characters/AncientDragon'

describe("Dragon's Hall", () => {
  it('initializes with the dragon and without the scale', () => {
    const room = new DragonsHall()
    expect(room.name).toBe("Dragon's Hall")
    expect(room.description).toContain('vast chamber')
    expect(room.description).toContain('massive coils')
    expect(room.description).toContain('Ancient Dragon')
  })

  it('describes the hall in a few plain sentences', () => {
    const room = new DragonsHall()
    const sentences = room.description.split(/(?<=[.!?])\s+/)
    expect(sentences.length).toBeLessThanOrEqual(4)
    expect(room.description).not.toContain('cathedral')
    expect(room.description).not.toContain('otherworldly')
    expect(room.description).toContain('embers')
    expect(room.description).toContain('Sigils')

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
