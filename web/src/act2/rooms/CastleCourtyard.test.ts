import { describe, expect, it } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { FLAG_SQUIRES_TALKED_TO } from '../Act2StoryFlags'
import {
  executeCommands,
  expectItemInRoom,
  expectMarkupWellFormed,
} from '@/testing/gameHelpers'

/** A game with the player in the Castle Courtyard. */
function createGameInCourtyard(): Game {
  const game = new Game([new Act2()])
  game.state.currentRoom = game.state.allRooms.CastleCourtyard
  return game
}

describe('Castle Courtyard search', () => {
  it('finds no diary before the squires have been talked to', () => {
    const game = createGameInCourtyard()

    const answer = executeCommands(game, ['search'])

    expectItemInRoom(game.state.currentRoom, "squire's diary", false)
    expectMarkupWellFormed(answer)
  })

  it("finds the squire's diary once, after the squires have been talked to", () => {
    const game = createGameInCourtyard()
    executeCommands(game, ['search'])
    game.state.setStoryFlag(FLAG_SQUIRES_TALKED_TO, true)

    const found = executeCommands(game, ['search'])
    expectItemInRoom(game.state.currentRoom, "squire's diary")
    expectMarkupWellFormed(found)

    executeCommands(game, ["take squire's diary"])
    const again = executeCommands(game, ['search'])
    expect(again).toContain('already searched')
    expectItemInRoom(game.state.currentRoom, "squire's diary", false)
  })
})
