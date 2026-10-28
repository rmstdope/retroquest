import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { TrueSelf } from './TrueSelf'
import { FLAG_ACT4_TRUTH_TOLD } from '../Act4StoryFlags'
import {
  expectDialogueSpeaker,
  expectMarkupWellFormed,
} from '@/testing/gameHelpers'

describe('TrueSelf', () => {
  it('answers to reflection and asks why Elior came', () => {
    const game = new Game([new Act4()])
    const self = new TrueSelf()
    expect(self.answersTo('reflection')).toBe(true)
    expect(self.answersTo('true self')).toBe(true)
    const talk = self.talkTo(game.state)
    expectDialogueSpeaker(talk, 'True Self')
    expect(talk).toContain(
      'You tell everyone you came for the king. Tell me the truth: why did you really come?',
    )
    expect(talk).not.toContain('You told Mira')
  })

  it.each([
    'the truth',
    'I will tell you the truth',
    'revenge',
    'I want vengeance',
  ])('takes %s as the truth', (words) => {
    const game = new Game([new Act4()])
    const told = new TrueSelf().sayTo(game.state, words)
    expect(told).toContain('[event]✦ Truth — this will be remembered[/event]')
    expect(game.state.getStoryFlag(FLAG_ACT4_TRUTH_TOLD)).toBe(true)
  })

  it.each([
    "I don't want revenge",
    'not the truth',
    'I never wanted vengeance',
  ])('does not take the denial %s as the truth', (words) => {
    const game = new Game([new Act4()])
    new TrueSelf().sayTo(game.state, words)
    expect(game.state.getStoryFlag(FLAG_ACT4_TRUTH_TOLD)).toBe(false)
    expect(game.state.hasVirtue('truth')).toBe(false)
  })

  it.each(['king', 'for the king', 'alden'])(
    'answers %s with the part of the truth it is',
    (words) => {
      const game = new Game([new Act4()])
      const answer = new TrueSelf().sayTo(game.state, words)
      expect(answer).toContain(
        'That is what you tell everyone. It is true. It is not all of it.',
      )
      expectDialogueSpeaker(answer, 'True Self')
      expect(game.state.hasVirtue('truth')).toBe(false)
    },
  )

  it('records the truth once, however it is typed', () => {
    const game = new Game([new Act4()])
    const self = new TrueSelf()
    const told = self.sayTo(game.state, ' "Truth" ')
    expect(told).toContain('[event]✦ Truth — this will be remembered[/event]')
    expectMarkupWellFormed(told)
    expect(game.state.getStoryFlag(FLAG_ACT4_TRUTH_TOLD)).toBe(true)
    expect(game.state.hasVirtue('truth')).toBe(true)
    const again = self.sayTo(game.state, 'truth')
    expect(again).toContain('has heard your truth')
    expect(again).not.toContain('will be remembered')
    expect(game.state.virtues).toEqual(['truth'])
  })

  it('accepts the truth with trailing punctuation', () => {
    const game = new Game([new Act4()])
    new TrueSelf().sayTo(game.state, '"truth."')
    expect(game.state.getStoryFlag(FLAG_ACT4_TRUTH_TOLD)).toBe(true)
  })

  it('waits at other words', () => {
    const game = new Game([new Act4()])
    const answer = new TrueSelf().sayTo(game.state, 'hello')
    expect(answer).toBe(
      '[failure][clue]The reflection waits. It has heard you say easier things than that.[/clue][/failure]',
    )
    expect(answer).not.toContain('shakes its head')
    expect(game.state.hasVirtue('truth')).toBe(false)
  })
})

describe('TrueSelf markup', () => {
  it('writes well-formed answers before and after the truth', () => {
    const game = new Game([new Act4()])
    const self = new TrueSelf()
    const answers = [self.examine(game.state), self.talkTo(game.state)]
    self.sayTo(game.state, 'truth')
    answers.push(self.talkTo(game.state), self.sayTo(game.state, 'truth'))
    for (const answer of answers) expectMarkupWellFormed(answer)
  })
})
