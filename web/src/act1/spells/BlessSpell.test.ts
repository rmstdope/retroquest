import { describe, expect, it } from 'vitest'
import { Game } from '@/engine'
import { executeCommands } from '@/testing/gameHelpers'
import { Act1 } from '../Act1'
import { Matches } from '../items/Matches'
import {
  FLAG_JOURNEY_BLESS_COMPLETED,
  FLAG_MAGIC_FULLY_UNLOCKED,
  FLAG_PRIEST_BLESSED,
} from '../Act1StoryFlags'

/**
 * Bless is gated on Mira's teaching like the other Act I spells (rq-m5tb):
 * taking the locket teaches the words, but they do nothing until magic is
 * learned for real.
 */

/** An Act I game in the chapel, candle lit and locket taken, so bless is known. */
function withLocket(): Game {
  const game = new Game([new Act1()])
  game.state.currentRoom = game.state.allRooms.VillageChapel
  executeCommands(game, ['talk to priest'])
  game.state.addItemToInventory(new Matches())
  executeCommands(game, ['use candle with matches', 'take locket'])
  return game
}

describe('BlessSpell gating', () => {
  it('teaches bless when the locket is taken', () => {
    const game = withLocket()
    expect(game.state.knownSpells.some((s) => s.id === 'bless')).toBe(true)
  })

  it.each(['cast bless', 'cast bless on me', 'cast bless on priest'])(
    'does nothing on "%s" before Mira has taught Elior',
    (command) => {
      const game = withLocket()
      const text = executeCommands(game, [command])
      expect(text).toContain('the door it wants is not open yet')
      expect(game.state.getStoryFlag(FLAG_JOURNEY_BLESS_COMPLETED)).toBe(false)
      expect(game.state.getStoryFlag(FLAG_PRIEST_BLESSED)).toBe(false)
    },
  )

  it('blesses Elior once magic is unlocked', () => {
    const game = withLocket()
    game.state.setStoryFlag(FLAG_MAGIC_FULLY_UNLOCKED, true)
    executeCommands(game, ['cast bless'])
    expect(game.state.getStoryFlag(FLAG_JOURNEY_BLESS_COMPLETED)).toBe(true)
  })

  it('blesses the priest once magic is unlocked', () => {
    const game = withLocket()
    game.state.setStoryFlag(FLAG_MAGIC_FULLY_UNLOCKED, true)
    executeCommands(game, ['cast bless on priest'])
    expect(game.state.getStoryFlag(FLAG_PRIEST_BLESSED)).toBe(true)
  })
})
