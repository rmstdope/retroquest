import { describe, it, expect, beforeEach } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import {
  FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT,
  FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED,
  FLAG_ACT3_VOW_OF_COURAGE_MADE,
} from '../Act3StoryFlags'
import {
  executeCommands,
  expectStoryFlag,
  expectItemInInventory,
} from '@/testing/gameHelpers'

/**
 * Tests for guardian interaction, vow acceptance gating and crystal
 * acquisition: once accepted the vow sets the VOW flag and the Crystal of
 * Light can be picked up.
 */
describe('Sanctum of the Tide', () => {
  let game: Game

  beforeEach(() => {
    game = new Game([new Act3()])
    game.state.currentRoom = game.state.allRooms.SanctumOfTheTide
  })

  it('accepts the vow and lets the crystal be taken when prerequisites are met', () => {
    // Set prerequisites
    game.state.setStoryFlag(FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT, true)
    game.state.setStoryFlag(FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED, true)

    const vow = executeCommands(game, ['say myself to tide-born guardian'])
    expect(
      vow.toLowerCase().includes('you may now take') ||
        vow.toLowerCase().includes('waters draw back'),
    ).toBe(true)
    expectStoryFlag(game.state, FLAG_ACT3_VOW_OF_COURAGE_MADE, true)

    executeCommands(game, ['take crystal of light'])
    expectItemInInventory(game.state, 'crystal of light', true)
  })
})
