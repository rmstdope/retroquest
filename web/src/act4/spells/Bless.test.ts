import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { FLAG_ACT4_ELIXIR_ON_KING } from '../Act4StoryFlags'
import { executeCommands } from '@/testing/gameHelpers'

/** An Act IV game standing in the Throne Chamber, bless known from the setup. */
function inThrone(): Game {
  const game = new Game([new Act4()])
  game.state.currentRoom = game.state.allRooms.ThroneChamber
  return game
}

describe('bless on King Alden', () => {
  it('slows the grey light through the crystal, and he does not wake', () => {
    const out = executeCommands(inThrone(), ['cast bless on king alden'])
    expect(out).toContain(
      'for a moment the grey light running out of him slows. It is not ' +
        'enough. He does not wake.',
    )
  })

  it('is kindly taken once the prison is broken', () => {
    const game = inThrone()
    game.state.setStoryFlag(FLAG_ACT4_ELIXIR_ON_KING, true)
    expect(executeCommands(game, ['cast bless on king'])).toContain(
      'It is kindly meant, and kindly taken.',
    )
  })
})
