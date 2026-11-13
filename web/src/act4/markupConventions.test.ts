/**
 * Act IV text follows the markup conventions on every answer of the golden
 * path and of the alternate choices its tests play: the Justice and Sacrifice
 * endings at the Throne Chamber (with and without the virtues that change
 * what Malakar hears), and the unanswered wrong words. One sweep stands in for
 * a markup and speaker test per character state, so a state reached on any of
 * these paths is checked for free.
 */
import { describe, expect, it } from 'vitest'
import { Game } from '@/engine'
import {
  castOf,
  markupConventionProblems,
  playAnswers,
  talkedTwice,
  wordsTriedWrongFirst,
  type PlayedAnswer,
} from '@/testing/markupConventions'
import { Act4 } from './Act4'
import { ACT4_GOLDEN_PATH } from './Act4GoldenPath'
import { VIRTUE_SELFLESS, VIRTUE_TRUTH } from './Act4StoryFlags'

const FORGIVENESS = 'say forgiveness to malakar'

/** The golden path up to the choice of ending, which each alternate answers differently. */
const BEFORE_ENDING = ACT4_GOLDEN_PATH.slice(
  0,
  ACT4_GOLDEN_PATH.indexOf(FORGIVENESS),
)
const AFTER_ENDING = ACT4_GOLDEN_PATH.slice(
  ACT4_GOLDEN_PATH.indexOf(FORGIVENESS) + 1,
)

/** The golden path and every alternate choice, with the names of every character met along them. */
function paths(): { played: [string, PlayedAnswer[]][]; cast: string[] } {
  const cast = new Set(['Elior', 'Voice', 'An Echo'])
  const play = (
    label: string,
    commands: string[],
    virtues: string[] = [],
  ): [string, PlayedAnswer[]] => {
    const game = new Game([new Act4()])
    castOf(game).forEach((name) => cast.add(name))
    const answers = playAnswers(game, BEFORE_ENDING)
    for (const virtue of virtues) game.state.addVirtue(virtue)
    answers.push(...playAnswers(game, commands))
    castOf(game).forEach((name) => cast.add(name))
    return [label, answers]
  }
  const playFull = (
    label: string,
    commands: string[],
  ): [string, PlayedAnswer[]] => {
    const game = new Game([new Act4()])
    const answers = playAnswers(game, commands)
    castOf(game).forEach((name) => cast.add(name))
    return [label, answers]
  }
  const played = [
    playFull('every talk made twice', talkedTwice(ACT4_GOLDEN_PATH)),
    playFull(
      'every word tried wrongly first',
      wordsTriedWrongFirst(ACT4_GOLDEN_PATH),
    ),
    play('golden path', ACT4_GOLDEN_PATH.slice(BEFORE_ENDING.length)),
    play(
      'the Forgiveness ending with two truths',
      [FORGIVENESS, ...AFTER_ENDING],
      [VIRTUE_TRUTH, VIRTUE_TRUTH],
    ),
    play(
      'the Forgiveness ending with two selfless deeds',
      [FORGIVENESS, ...AFTER_ENDING],
      [VIRTUE_SELFLESS, VIRTUE_SELFLESS],
    ),
    play('the Justice ending', [
      'say hello to malakar',
      'say justice to malakar',
      ...AFTER_ENDING,
    ]),
    play('the Sacrifice ending', ['say sacrifice to malakar', ...AFTER_ENDING]),
  ]
  return { played, cast: [...cast] }
}

describe('Act IV markup conventions', () => {
  it('holds on every answer of the golden path and the alternate choices', () => {
    const { played, cast } = paths()
    const problems = played.flatMap(([label, answers]) => {
      expect(answers.length, label).toBeGreaterThan(0)
      return markupConventionProblems(answers, cast).map(
        (problem) => `${label}: ${problem}`,
      )
    })
    expect(problems).toEqual([])
  })
})
