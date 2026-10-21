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
    expect(told).toContain('[dim]Elior will remember this.[/dim]')
    expectMarkupWellFormed(told)
    expect(game.state.getStoryFlag(FLAG_ACT4_TRUTH_TOLD)).toBe(true)
    expect(game.state.hasVirtue('truth')).toBe(true)
    expect(self.sayTo(game.state, 'truth')).toContain('has heard your truth')
    expect(game.state.virtues).toEqual(['truth'])
  })

  it('shakes its head at other words', () => {
    const game = new Game([new Act4()])
    const answer = new TrueSelf().sayTo(game.state, 'hello')
    expect(answer).toBe('[dim]The reflection only shakes its head.[/dim]')
    expect(game.state.hasVirtue('truth')).toBe(false)
  })
})
