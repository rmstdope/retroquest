import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { FLAG_ACT4_REDEMPTION_ENDING } from '../Act4StoryFlags'
import { SorceressTruth } from '../items/SorceressTruth'
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

describe('Mira in Willowbrook Field', () => {
  it.each([
    ['i forgive you', 'I know what that costs.'],
    ['you should have told me', 'I should have.'],
    ['parents', 'your mother would have laughed'],
    ['malakar', 'Not at this gate, Elior.'],
    ['amulet', 'It has done what they made it for.'],
    ['grandmother', 'She has not sat down since you left.'],
    ['the weather', 'Some words keep, Elior.'],
  ])('answers "%s" in her own words', (words, line) => {
    const answer = executeCommands(inField(), [`say ${words} to mira`])
    expect(answer).toContain(line)
    expectDialogueSpeaker(answer, 'Mira')
    expectNoStockReply(answer)
  })

  it('takes turns with her deflections', () => {
    const game = inField()
    expect(executeCommands(game, ['say thank you to mira'])).toContain(
      'Some words keep, Elior.',
    )
    expect(executeCommands(game, ['say thank you to mira'])).toContain(
      'Tell me tomorrow.',
    )
  })

  it("hands the Sorceress's mask back with Elena in mind", () => {
    const game = inField()
    game.state.inventory.push(new SorceressTruth())
    const answer = executeCommands(game, ["give sorceress's truth to mira"])
    expect(answer).toContain('I burned the letter that asked me to come.')
    expectNoStockReply(answer)
    expect(game.state.inventory.some((i) => i instanceof SorceressTruth)).toBe(
      true,
    )
  })
})
