import { describe, it, expect, beforeEach } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { executeCommands } from '@/testing/gameHelpers'

/**
 * Tests for purifying pillars and completing the Tideward Sigils quest. They
 * jump to the Outer Wards for focused testing.
 */
describe('Outer Wards', () => {
  let game: Game

  beforeEach(() => {
    game = new Game([new Act3()])
    // Jump to Outer Wards for focused testing
    game.state.currentRoom = game.state.allRooms.OuterWards
  })

  it('mentions the pillars when searched', () => {
    const out = executeCommands(game, ['search'])
    expect(out.toLowerCase()).toContain('pillar')
  })
})
