import { describe, it, expect } from 'vitest'
import { GameState, Room } from '@/engine'
import { CollapsedGalleries } from './CollapsedGalleries'
import { FallenRock } from '../items/FallenRock'
import { ReinforcedBraces } from '../items/ReinforcedBraces'
import { SupportStraps } from '../items/SupportStraps'
import { WedgeBlocks } from '../items/WedgeBlocks'
import { Miners } from '../characters/Miners'
import { FLAG_ACT3_MINERS_RESCUE_COMPLETED } from '../Act3StoryFlags'

/** A bare game state (the port of the Python DummyGameState). */
function dummyState(room?: Room): GameState {
  return new GameState(
    room ?? new Room({ name: 'Nowhere', description: '' }),
    {},
    [],
  )
}

describe('Collapsed Galleries', () => {
  it('initializes with the fallen rock, no miners and three exits', () => {
    const room = new CollapsedGalleries()
    expect(room.name).toBe('Collapsed Galleries')
    expect(room.items.some((i) => i instanceof FallenRock)).toBe(true)
    // Miners should not be present initially - they appear after passage is freed
    expect(room.characters.some((c) => c instanceof Miners)).toBe(false)
    expect(
      'south' in room.exits && 'west' in room.exits && 'east' in room.exits,
    ).toBe(true)
  })

  it('runs the full miners rescue progression', () => {
    const room = new CollapsedGalleries()
    const gs = new GameState(room, { room }, [])
    const fallenRock = room.items[0] // Should be FallenRock

    // Initially, miners should not be present
    expect(room.characters.some((c) => c instanceof Miners)).toBe(false)

    // Get tools
    const braces = new ReinforcedBraces()
    gs.addItemToInventory(braces)
    const straps = new SupportStraps()
    gs.addItemToInventory(straps)
    const blocks = new WedgeBlocks()
    gs.addItemToInventory(blocks)

    // Step 0: Examine the fallen rock first (required before stabilization)
    const examineResult = fallenRock.examine(gs)
    expect(examineResult).toContain('massive pile of fallen rock')
    expect(examineResult).toContain('unstable')
    expect(examineResult).toContain('trapped')
    expect(examineResult).toContain('reinforcement')

    // Step 1: Use reinforced braces with fallen rock
    const result1 = fallenRock.useWith(gs, braces)
    expect(result1).toContain('stabilizing the collapse')
    expect(gs.inventory).not.toContain(braces) // Braces should be consumed

    // Step 2: Use support straps with fallen rock
    const result2 = fallenRock.useWith(gs, straps)
    expect(result2).toContain('bind the reinforced braces securely')
    expect(gs.inventory).not.toContain(straps) // Straps should be consumed

    // Step 3: Use wedge blocks with fallen rock (this should add miners to room)
    const result3 = fallenRock.useWith(gs, blocks)
    expect(result3).toContain('freeing the blocked passage')
    expect(result3).toContain('trapped miners emerging')
    expect(gs.inventory).not.toContain(blocks) // Blocks should be consumed

    // After freeing passage, miners should now be present in the room
    expect(room.characters.some((c) => c instanceof Miners)).toBe(true)
    const miners = room.characters.find((c) => c instanceof Miners)
    expect(miners).toBeDefined()

    // Step 4: Talk to miners
    const result4 = miners!.talkTo(gs)
    expect(result4).toContain('Thank the gods you found us')
    expect(gs.getStoryFlag(FLAG_ACT3_MINERS_RESCUE_COMPLETED)).toBe(true)
  })

  it('blocks the east exit until the rescue is completed', () => {
    const room = new CollapsedGalleries()
    const gs = dummyState(room)
    // By default, east is hidden
    const exits = room.getExits(gs)
    expect(exits).not.toHaveProperty('east')
    expect(exits).toHaveProperty('south')
    expect(exits).toHaveProperty('west')
    // Set completion flag
    gs.setStoryFlag(FLAG_ACT3_MINERS_RESCUE_COMPLETED, true)
    const exits2 = room.getExits(gs)
    expect(exits2).toHaveProperty('east')
  })

  it('requires stabilization before the straps can be used', () => {
    const fallenRock = new FallenRock()
    const gs = dummyState()
    const straps = new SupportStraps()
    // Try straps before stabilization
    const result = straps.useWith(gs, fallenRock)
    expect(result).toContain('stabilize the collapse with braces')
  })
})
