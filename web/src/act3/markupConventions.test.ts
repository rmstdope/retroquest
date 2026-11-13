/**
 * Act III text follows the markup conventions on every answer of the golden
 * path and of the alternate choices its tests play: Mira's answers to the
 * confession, the Phoenix and the Dragon answered wrongly first, and the
 * act's closing commands. One sweep stands in for a markup and speaker test
 * per character state, so a state reached on any of these paths is checked
 * for free.
 */
import { describe, expect, it } from 'vitest'
import { Game } from '@/engine'
import { pathIndex } from '@/testing/gameHelpers'
import {
  castOf,
  markupConventionProblems,
  playAnswers,
  talkedTwice,
  wordsTriedWrongFirst,
  type PlayedAnswer,
} from '@/testing/markupConventions'
import { Act3 } from './Act3'
import { ACT3_COMPLETING_COMMANDS, ACT3_GOLDEN_PATH } from './Act3GoldenPath'

/** The golden path and the commands that complete the act. */
const FULL_PATH = [...ACT3_GOLDEN_PATH, ...ACT3_COMPLETING_COMMANDS]

/** The commands whose answer quotes a written text, an inscription, in the narration. */
const QUOTING_COMMANDS = ['search', 'examine runic walls']

/** The golden path with the commands inserted before the step at `index`. */
function withBefore(index: number, commands: string[]): string[] {
  return [
    ...ACT3_GOLDEN_PATH.slice(0, index),
    ...commands,
    ...ACT3_GOLDEN_PATH.slice(index),
  ]
}

/** The golden path and every alternate choice, with the names of every character met along them. */
function paths(): { played: [string, PlayedAnswer[]][]; cast: string[] } {
  const cast = new Set(['Elior', 'Voice', 'Lead Miner'])
  const play = (
    label: string,
    commands: string[],
  ): [string, PlayedAnswer[]] => {
    const game = new Game([new Act3()])
    castOf(game).forEach((name) => cast.add(name))
    const answers = playAnswers(game, commands)
    castOf(game).forEach((name) => cast.add(name))
    return [label, answers]
  }
  const hut = pathIndex(ACT3_GOLDEN_PATH, 'w', 7)
  const phoenix = pathIndex(ACT3_GOLDEN_PATH, 'say patience to phoenix')
  const dragon = pathIndex(ACT3_GOLDEN_PATH, 'say everything to ancient dragon')
  const played = [
    play('golden path', [...ACT3_GOLDEN_PATH, ...ACT3_COMPLETING_COMMANDS]),
    play(
      "Mira's answers to the confession",
      withBefore(hut + 4, [
        'say parents to mira',
        'say mother to mira',
        'say i forgive you to mira',
        'say amulet to mira',
        'talk to mira',
        'say you should have told me to mira',
      ]),
    ),
    play(
      'the Phoenix answered wrongly first',
      withBefore(phoenix, ['say hello to phoenix', 'say courage to phoenix']),
    ),
    play('every talk made twice', talkedTwice(FULL_PATH)),
    play('every word tried wrongly first', wordsTriedWrongFirst(FULL_PATH)),
    play(
      'the Dragon answered wrongly first',
      withBefore(dragon, ['say hello to ancient dragon']),
    ),
  ]
  return { played, cast: [...cast] }
}

describe('Act III markup conventions', () => {
  it('holds on every answer of the golden path and the alternate choices', () => {
    const { played, cast } = paths()
    const problems = played.flatMap(([label, answers]) => {
      expect(answers.length, label).toBeGreaterThan(0)
      return markupConventionProblems(answers, cast, QUOTING_COMMANDS).map(
        (problem) => `${label}: ${problem}`,
      )
    })
    expect(problems).toEqual([])
  })
})
