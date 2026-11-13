/**
 * Act II text follows the markup conventions on every answer of the golden
 * path and of the alternate choices its integration test plays: Sir Cedric's
 * other answer, the leaves never given, and the three optional virtue
 * moments. One sweep stands in for a markup and speaker test per character
 * state, so a state reached on any of these paths is checked for free.
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
import { Act2 } from './Act2'
import { ACT2_COMPLETING_COMMANDS, ACT2_GOLDEN_PATH } from './Act2GoldenPath'
import { MountainFlower } from './items/MountainFlower'

const GIVE_LEAVES = 'give silver leaves to master healer lyria'

/** The golden path and every alternate choice, as (label, answers), with the names of every character met along them. */
function paths(): { played: [string, PlayedAnswer[]][]; cast: string[] } {
  const cast = new Set(['Elior', 'Voice'])
  const play = (commands: string[]): PlayedAnswer[] => {
    const game = new Game([new Act2()])
    castOf(game).forEach((name) => cast.add(name))
    const answers = playAnswers(game, commands)
    castOf(game).forEach((name) => cast.add(name))
    return answers
  }
  const virtues = new Game([new Act2()])
  castOf(virtues).forEach((name) => cast.add(name))
  const answers = playAnswers(virtues, [
    ...ACT2_GOLDEN_PATH,
    ...ACT2_COMPLETING_COMMANDS,
  ])
  virtues.state.addItemToInventory(new MountainFlower())
  for (const [room, command] of [
    ['ResidentialQuarter', 'give mountain flower to families'],
    ['SilverStagInn', 'say truth to marcus'],
    ['SilverStagInn', 'talk to barmaid elena'],
    ['MarketDistrict', 'say forgive to thorne'],
  ]) {
    virtues.state.currentRoom = virtues.state.allRooms[room]
    answers.push(...playAnswers(virtues, [command]))
  }
  castOf(virtues).forEach((name) => cast.add(name))
  const played: [string, PlayedAnswer[]][] = [
    ['golden path', play([...ACT2_GOLDEN_PATH, ...ACT2_COMPLETING_COMMANDS])],
    [
      'Cedric answered with the truth',
      play([
        ...ACT2_GOLDEN_PATH,
        'cast prophetic vision',
        'say truth to cedric',
      ]),
    ],
    [
      'the leaves never given',
      play([
        ...ACT2_GOLDEN_PATH.filter((command) => command !== GIVE_LEAVES),
        'cast prophetic vision',
      ]),
    ],
    ['the three virtue moments', answers],
    [
      'every talk made twice',
      play(talkedTwice([...ACT2_GOLDEN_PATH, ...ACT2_COMPLETING_COMMANDS])),
    ],
    [
      'every word tried wrongly first',
      play(
        wordsTriedWrongFirst([
          ...ACT2_GOLDEN_PATH,
          ...ACT2_COMPLETING_COMMANDS,
        ]),
      ),
    ],
  ]
  return { played, cast: [...cast] }
}

describe('Act II markup conventions', () => {
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
