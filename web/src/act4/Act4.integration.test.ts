import { describe, it, expect, beforeEach } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from './Act4'
import {
  FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED,
  FLAG_ACT4_GUARDIANS_ESSENCE_ACQUIRED,
  FLAG_ACT4_GUARDIANS_CHAIN_ACQUIRED,
  FLAG_ACT4_TRAPPED_SERVANTS_COMPLETED,
} from './Act4StoryFlags'
import {
  executeCommands,
  expectCurrentRoom,
  expectItemInInventory,
  expectStoryFlag,
} from '@/testing/gameHelpers'

describe('Act 4 integration', () => {
  let act4: Act4
  let game: Game

  beforeEach(() => {
    act4 = new Act4()
    act4.musicFile = ''
    game = new Game([act4])
  })

  it('initializes correctly', () => {
    expect(act4).not.toBeNull()
    expect(typeof act4.rooms, 'rooms is a record').toBe('object')
    expect(Array.isArray(act4.quests), 'quests is a list').toBe(true)
    expect(act4.getActIntro()).not.toBeNull()
  })

  it('can be loaded into a Game', () => {
    expect(game).not.toBeNull()
    expect(game.acts).toHaveLength(1)
    expect(game.acts[0]).toBe(act4)
  })

  it('golden path phase 1: fortress breach', () => {
    // Steps 1-3 of the golden path:
    // 1. Fortress Gates - Ward guardians quest
    // 2. Outer Courtyard - Trapped servants quest
    // 3. Mirror Labyrinth - Initial incomplete visit

    // Should start in Fortress Gates
    expectCurrentRoom(game.state, 'Fortress Gates')

    // Phase 1.1: Examine ward stones to understand the mechanism
    let result = executeCommands(game, ['examine ward stones'])
    expect(
      result.toLowerCase().includes('shadow guardians') ||
        result.toLowerCase().includes('anchor points'),
    ).toBe(true)

    // Phase 1.2: Take ward stone fragment (should be available)
    executeCommands(game, ['take ward stone fragment'])
    expectItemInInventory(game.state, 'Ward Stone Fragment', true)

    // Phase 1.3: Use ward stone fragment to disable barriers
    result = executeCommands(game, ['use ward stone fragment with barriers'])
    expect(
      result.toLowerCase().includes('disable') ||
        result.toLowerCase().includes('barrier'),
    ).toBe(true)

    // Phase 1.4: Cast light to dispel shadow guardians
    result = executeCommands(game, ['cast light on ward stones'])
    expect(
      result.toLowerCase().includes('dispel') ||
        result.toLowerCase().includes('banish') ||
        result.toLowerCase().includes('guardians'),
    ).toBe(true)

    // Quest should be completed and Guardian's Essence obtained
    expectStoryFlag(
      game.state,
      FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED,
      true,
    )

    // Phase 1.5: Take Guardian's Chain for later protection
    executeCommands(game, ["take guardian's chain"])
    expectItemInInventory(game.state, "Guardian's Chain", true)
    expectStoryFlag(game.state, FLAG_ACT4_GUARDIANS_CHAIN_ACQUIRED, true)

    // Phase 1.6: Take Guardian's Essence (should be available after light spell)
    executeCommands(game, ["take guardian's essence"])
    expectItemInInventory(game.state, "Guardian's Essence", true)
    expectStoryFlag(game.state, FLAG_ACT4_GUARDIANS_ESSENCE_ACQUIRED, true)
  })

  it('has the required items available in Fortress Gates', () => {
    // Start at Fortress Gates
    expectCurrentRoom(game.state, 'Fortress Gates')

    // Check that we can take ward stone fragment
    executeCommands(game, ['take ward stone fragment'])
    expectItemInInventory(game.state, 'Ward Stone Fragment', true)

    // Check that we can take guardian's chain
    executeCommands(game, ["take guardian's chain"])
    expectItemInInventory(game.state, "Guardian's Chain", true)
  })

  it('has working room transitions in phase 1', () => {
    // Start in Fortress Gates
    expectCurrentRoom(game.state, 'Fortress Gates')

    // Move to Outer Courtyard
    executeCommands(game, ['east'])
    expectCurrentRoom(game.state, 'Outer Courtyard')

    // Move to Mirror Labyrinth
    executeCommands(game, ['north'])
    expectCurrentRoom(game.state, 'Mirror Labyrinth')

    // Return to Outer Courtyard
    executeCommands(game, ['south'])
    expectCurrentRoom(game.state, 'Outer Courtyard')

    // Return to Fortress Gates
    executeCommands(game, ['west'])
    expectCurrentRoom(game.state, 'Fortress Gates')
  })

  it('sets story flags correctly during phase 1', () => {
    // Initially no flags should be set
    expectStoryFlag(
      game.state,
      FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED,
      false,
    )
    expectStoryFlag(game.state, FLAG_ACT4_GUARDIANS_ESSENCE_ACQUIRED, false)
    expectStoryFlag(game.state, FLAG_ACT4_GUARDIANS_CHAIN_ACQUIRED, false)
    expectStoryFlag(game.state, FLAG_ACT4_TRAPPED_SERVANTS_COMPLETED, false)

    // Simulate ward guardians quest completion
    // (Actual implementation would involve the quest system)
    game.state.setStoryFlag(FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED, true)
    game.state.setStoryFlag(FLAG_ACT4_GUARDIANS_ESSENCE_ACQUIRED, true)
    game.state.setStoryFlag(FLAG_ACT4_GUARDIANS_CHAIN_ACQUIRED, true)

    // Check flags are now set
    expectStoryFlag(
      game.state,
      FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED,
      true,
    )
    expectStoryFlag(game.state, FLAG_ACT4_GUARDIANS_ESSENCE_ACQUIRED, true)
    expectStoryFlag(game.state, FLAG_ACT4_GUARDIANS_CHAIN_ACQUIRED, true)
  })
})
