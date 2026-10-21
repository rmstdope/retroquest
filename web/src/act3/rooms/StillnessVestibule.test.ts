import { describe, it, expect } from 'vitest'
import { GameState, Room } from '@/engine'
import { StillnessVestibule } from './StillnessVestibule'
import { EchoStones } from '../items/EchoStones'
import { SilenceKeeper } from '../characters/SilenceKeeper'
import { WanderingPhantoms } from '../characters/WanderingPhantoms'
import { FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED } from '../Act3StoryFlags'

/** A bare game state with empty story flags (the Python DummyGameState). */
function dummyState(): GameState {
  return new GameState(new Room({ name: 'Nowhere', description: '' }), {}, [])
}

describe('Stillness Vestibule', () => {
  it('describes the room in a few plain sentences', () => {
    const room = new StillnessVestibule()
    const sentences = room.description.split(/(?<=[.!?])\s+/)
    expect(sentences.length).toBeLessThanOrEqual(4)
    expect(room.description).not.toContain('otherworldly')
    expect(room.description).toContain('echo stones')
    expect(room.description).toContain('pools')
  })

  it('initializes with its items, the keeper and the phantoms', () => {
    const room = new StillnessVestibule()
    expect(room.name).toBe('Stillness Vestibule')

    // Check items
    const itemNames = room.items.map((item) => item.name)
    expect(itemNames).toContain('echo stones')
    expect(itemNames).toContain('stillwater phial')
    expect(itemNames).toContain('quiet charm')

    // Check character
    expect(room.characters.some((c) => c instanceof SilenceKeeper)).toBe(true)

    // Check that phantoms are initially present
    expect(room.characters.some((c) => c instanceof WanderingPhantoms)).toBe(
      true,
    )
  })

  it("blocks the Dragon's Hall exit initially", () => {
    const room = new StillnessVestibule()
    const gs = dummyState()

    const exits = room.getExits(gs)
    expect(exits).toHaveProperty('north') // CollapsedGalleries
    expect(exits).toHaveProperty('west') // CavernMouth
    expect(exits).not.toHaveProperty('east') // DragonsHall should be blocked
  })

  it("opens the Dragon's Hall exit after the Oath is completed", () => {
    const room = new StillnessVestibule()
    const gs = dummyState()
    gs.setStoryFlag(FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED, true)

    const exits = room.getExits(gs)
    expect(exits).toHaveProperty('north') // CollapsedGalleries
    expect(exits).toHaveProperty('west') // CavernMouth
    expect(exits).toHaveProperty('east') // DragonsHall should be open
    expect(exits.east).toBe('DragonsHall')
  })

  it('holds unblessed echo stones', () => {
    const room = new StillnessVestibule()

    // Find echo stones
    const echoStones = room.items.find((item) => item instanceof EchoStones)

    expect(echoStones).toBeDefined()
    expect(echoStones!.areBlessed()).toBe(false) // Should start unblessed
  })

  it('has phantoms that only whisper', () => {
    const room = new StillnessVestibule()
    const gs = dummyState()

    // Find the phantoms
    const phantoms = room.characters.find((c) => c instanceof WanderingPhantoms)

    expect(phantoms).toBeDefined()

    // Test that they only respond with whispers
    const response = phantoms!.talkTo(gs)
    // Check for mystical/ethereal response elements that indicate undecipherable speech
    const mysticalIndicators = [
      'whisper',
      'ethereal',
      'spectral',
      'sibilant',
      'half-formed',
      'cannot grasp',
      'slip away',
      'mist',
      'beyond understanding',
    ]
    expect(
      mysticalIndicators.some((indicator) =>
        response.toLowerCase().includes(indicator),
      ),
    ).toBe(true)

    // Make sure it's ethereal/mystical dialogue, not normal conversation
    expect(response.toLowerCase()).not.toContain('hello')
    expect(response.toLowerCase()).not.toContain('greetings')
  })
})
