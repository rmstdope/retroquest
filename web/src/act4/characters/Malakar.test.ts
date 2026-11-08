import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { ACT4_GOLDEN_PATH } from '../Act4GoldenPath'
import { FLAG_ACT4_THRONE_BARGAIN_SEEN } from '../Act4StoryFlags'
import { executeCommands, expectDialogueSpeaker } from '@/testing/gameHelpers'

/** The catch-all that answers words with no reply of their own. */
const CATCH_ALL = 'told him no once, in a letter'

/** A game with Elior just inside the Throne Chamber. */
function inThrone(): Game {
  const game = new Game([new Act4()])
  const end = ACT4_GOLDEN_PATH.indexOf('examine memories') + 1
  executeCommands(game, [...ACT4_GOLDEN_PATH.slice(0, end), 'n'])
  return game
}

describe('Malakar', () => {
  it('holds off the amulet offered before he has spoken', () => {
    const game = inThrone()
    const answer = executeCommands(game, ['give ancient amulet to malakar'])
    expect(answer).toContain('You have not heard what I am offering.')
    expect(answer).not.toContain(CATCH_ALL)
    expect(game.state.getStoryFlag(FLAG_ACT4_THRONE_BARGAIN_SEEN)).toBe(false)
  })

  it.each([
    ['aren', 'Aren told me no'],
    ['lysa', 'Lysa told me no'],
    ['mira', 'I taught her her first spell.'],
    ['patience', 'Patience is a thing you tell someone else to have.'],
  ])('answers "%s" in his own words', (words, line) => {
    const answer = executeCommands(inThrone(), [`say ${words} to malakar`])
    expect(answer).toContain(line)
    expectDialogueSpeaker(answer, 'Malakar')
    expect(answer).not.toContain(CATCH_ALL)
  })

  it.each(['redemption', 'i forgive you'])(
    'points at the amulet when "%s" is said after the refrain',
    (words) => {
      const game = inThrone()
      executeCommands(game, [
        'talk to malakar',
        'say power follows purpose to malakar',
      ])
      const answer = executeCommands(game, [`say ${words} to malakar`])
      expect(answer).toContain('Then show me what they left you.')
      expect(answer).not.toContain(CATCH_ALL)
    },
  )
})
