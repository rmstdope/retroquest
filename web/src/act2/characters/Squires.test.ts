import { describe, expect, it } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import {
  FLAG_CEDRIKS_HONOR_ACCEPTED,
  FLAG_SQUIRES_TALKED_TO,
} from '../Act2StoryFlags'
import { executeCommands, expectMarkupWellFormed } from '@/testing/gameHelpers'

/** A game with the player among the squires in the Castle Courtyard. */
function createGameInCourtyard(): Game {
  const game = new Game([new Act2()])
  game.state.currentRoom = game.state.allRooms.CastleCourtyard
  return game
}

describe('Squires', () => {
  it("brush the player off before Cedric's Lost Honor is accepted", () => {
    const game = createGameInCourtyard()

    const answer = executeCommands(game, ['talk to squires'])

    expect(answer).not.toContain('benches')
    expect(game.state.getStoryFlag(FLAG_SQUIRES_TALKED_TO)).toBe(false)
    expectMarkupWellFormed(answer)
  })

  it('point to the stone benches once the quest is accepted', () => {
    const game = createGameInCourtyard()
    game.state.setStoryFlag(FLAG_CEDRIKS_HONOR_ACCEPTED, true)

    const answer = executeCommands(game, ['talk to squires'])

    expect(answer).toContain('benches')
    expect(game.state.getStoryFlag(FLAG_SQUIRES_TALKED_TO)).toBe(true)
    expectMarkupWellFormed(answer)
  })
})
