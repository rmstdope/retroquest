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
    expect(talk).toContain('Tell me why you really came.')
  })

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

  it('shakes its head at other words', () => {
    const game = new Game([new Act4()])
    const answer = new TrueSelf().sayTo(game.state, 'hello')
    expect(answer).toBe('[dim]The reflection only shakes its head.[/dim]')
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
