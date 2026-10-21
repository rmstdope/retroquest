import { describe, it, expect } from 'vitest'
import { Game, GameState, Room } from '@/engine'
import { Act3 } from '../Act3'
import { FLAG_ACT3_ECHO_HEARD } from '../Act3StoryFlags'
import { expectMarkupWellFormed, expectStoryFlag } from '@/testing/gameHelpers'
import { EchoChambers } from './EchoChambers'
import { RunicWalls } from '../items/RunicWalls'
import { ResonantChantRubbings } from '../items/ResonantChantRubbings'
import { OldOathScrolls } from '../items/OldOathScrolls'

const RUBBINGS = 'Resonant Chant Rubbings'
const SCROLLS = 'Old Oath Scrolls'

/** A bare game state whose current room can be switched (the Python DummyGameState). */
function dummyState(): GameState {
  return new GameState(new Room({ name: 'Nowhere', description: '' }), {}, [])
}

function itemNames(room: Room): string[] {
  return room.items.map((item) => item.name)
}

describe('Echo Chambers', () => {
  it('initializes with the runic walls and no scrolls', () => {
    const room = new EchoChambers()
    expect(room.name).toBe('Echo Chambers')
    const lower = room.description.toLowerCase()
    expect(lower.includes('echo') || lower.includes('cavern')).toBe(true)
    expect(room.items.some((i) => i instanceof RunicWalls)).toBe(true)
    // Old Oath Scrolls should NOT be present initially
    expect(room.items.some((i) => i instanceof OldOathScrolls)).toBe(false)
    expect(room.exits).toHaveProperty('west')
  })

  it('reveals the chant and adds rubbings once when the walls are examined', () => {
    const room = new EchoChambers()
    const walls = new RunicWalls()
    const gs = dummyState()
    gs.currentRoom = room
    // Check initial room items (should have runic walls but no rubbings)
    const initialItems = itemNames(room)
    expect(initialItems).toContain('runic walls')
    expect(initialItems).not.toContain(RUBBINGS)
    const result = walls.examine(gs)
    expect(result).toContain('Let stillness echo, let silence bind')
    expect(result).toContain('chant to quiet the phantoms')
    expect(result).toContain('rubbings')
    // Check that rubbings were added to the room
    const finalItems = itemNames(room)
    expect(finalItems).toContain(RUBBINGS)
    // Examine again - should not add duplicate rubbings using local flag
    const initialCount = itemNames(room).filter((n) => n === RUBBINGS).length
    walls.examine(gs)
    const finalCount = itemNames(room).filter((n) => n === RUBBINGS).length
    expect(initialCount).toBe(1)
    expect(finalCount).toBe(1)
    // Test that the local flag prevents discovery even in a different room
    const room2 = new EchoChambers()
    gs.currentRoom = room2
    walls.examine(gs)
    // Should not have rubbings in room2 because they were already discovered
    expect(itemNames(room2)).not.toContain(RUBBINGS)
  })

  it('discovers the rubbings only once across rooms', () => {
    const walls = new RunicWalls()
    const room1 = new EchoChambers()
    const room2 = new EchoChambers()
    const gs = dummyState()
    // First examine in room1 should discover rubbings
    gs.currentRoom = room1
    walls.examine(gs)
    expect(itemNames(room1)).toContain(RUBBINGS)
    // Second examine in room2 should not add rubbings due to flag
    gs.currentRoom = room2
    walls.examine(gs)
    expect(itemNames(room2)).not.toContain(RUBBINGS)
  })

  it('gives the resonant chant rubbings their properties', () => {
    const rubbings = new ResonantChantRubbings()
    expect(rubbings.name).toBe(RUBBINGS)
    expect(rubbings.description).toContain(
      'Let stillness echo, let silence bind',
    )
    expect(rubbings.canBeCarried).toBe(true)
  })

  it('reveals the Old Oath Scrolls when searched', () => {
    const room = new EchoChambers()
    const gs = dummyState()
    gs.currentRoom = room

    // Initially, Old Oath Scrolls should not be present
    expect(itemNames(room)).not.toContain(SCROLLS)

    // Search the room
    const searchResult = room.search(gs)
    expect(searchResult).toContain('ancient scrolls')
    expect(searchResult).toContain('stone niche')
    expect(searchResult).toContain('sacred promises')

    // After searching, Old Oath Scrolls should be present
    expect(itemNames(room)).toContain(SCROLLS)

    // Search again - should get different message
    const searchAgain = room.search(gs)
    expect(searchAgain).toContain('already discovered')
    expect(searchAgain).toContain('no further secrets')

    // Should not add duplicate scrolls
    const scrollsCount = itemNames(room).filter((n) => n === SCROLLS).length
    expect(scrollsCount).toBe(1)
  })
})

describe('Echo Chambers echo', () => {
  const OPENING =
    'You hold still. The whispers in the alcoves gather, and for a moment ' +
    'they are not copying you at all.'
  const CLOSING = 'Somewhere in the stone, a door closes.'
  const AFTER =
    'Only your own breath comes back from the stone, and under it, very ' +
    'faintly, a door closing.'

  it('plays the echo on the first listen, then the short line', () => {
    const game = new Game([new Act3()])
    const room = new EchoChambers()
    game.state.currentRoom = room

    const first = game.listen()
    expect(first).toContain(OPENING)
    expect(first).toContain("A man's voice, steady")
    expect(first).toContain("'Mal. Put the lamp down and listen to me.'")
    expect(first).toContain("'You would have me wait while you die.'")
    expect(first).toContain(CLOSING)
    expectMarkupWellFormed(first)
    expectStoryFlag(game.state, FLAG_ACT3_ECHO_HEARD, true)

    expect(game.listen()).toBe(`[dim]${AFTER}[/dim]`)
    expect(game.listen()).toBe(`[dim]${AFTER}[/dim]`)
  })

  it('leaves listen alone in other rooms', () => {
    const game = new Game([new Act3()])
    game.state.currentRoom = new Room({ name: 'Elsewhere', description: '' })
    expect(game.listen()).toBe('It is quiet here.')
    expectStoryFlag(game.state, FLAG_ACT3_ECHO_HEARD, false)
  })
})
