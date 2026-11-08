import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { FLAG_ACT4_REDEMPTION_ENDING } from '../Act4StoryFlags'
import { KnightsRedemption } from '../items/KnightsRedemption'
import {
  executeCommands,
  expectDialogueSpeaker,
  expectNoStockReply,
} from '@/testing/gameHelpers'

/** A game with Elior home in Willowbrook Field after the Redemption ending. */
function inField(): Game {
  const act = new Act4()
  act.musicFile = ''
  const game = new Game([act])
  game.state.setStoryFlag(FLAG_ACT4_REDEMPTION_ENDING, true)
  game.state.currentRoom = game.state.allRooms.WillowbrookField
  return game
}

describe('Sir Cedric in Willowbrook Field', () => {
  it("gives the knight's badge back", () => {
    const game = inField()
    game.state.inventory.push(new KnightsRedemption())
    const answer = executeCommands(game, [
      "give knight's redemption to sir cedric",
    ])
    expect(answer).toContain('I know whose that was.')
    expectDialogueSpeaker(answer, 'Sir Cedric')
    expectNoStockReply(answer)
    expect(
      game.state.inventory.some((i) => i instanceof KnightsRedemption),
    ).toBe(true)
  })
})
