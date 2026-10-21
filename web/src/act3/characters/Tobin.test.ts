import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { FLAG_ACT3_DRAGONS_MEMORY_RECEIVED } from '../Act3StoryFlags'
import { Tobin } from './Tobin'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'

const FIRST =
  'Tobin looks at you for a long moment. His lips part, then close again. ' +
  'He turns the cracked lamp over in his hands and goes back to watching the ceiling.'
const SECOND =
  'Tobin swallows, and you see what it costs him. No sound comes. He shakes his head, once.'
const THIRD =
  "Tobin does not look up. His thumb traces the crack in the lamp's glass, back and forth."

describe('Tobin', () => {
  it('answers to tobin, young miner and boy, however cased', () => {
    const tobin = new Tobin()
    for (const name of ['tobin', 'Tobin', 'young miner', 'boy', 'BOY']) {
      expect(tobin.answersTo(name)).toBe(true)
    }
    expect(tobin.answersTo('miners')).toBe(false)
  })

  it('is described as a boy who watches the ceiling', () => {
    const game = new Game([new Act3()])
    const answer = new Tobin().examine(game.state)
    expect(answer).toContain(
      'A boy of perhaps fifteen sits apart from the others on an upturned bucket',
    )
    expect(answer).toContain('He watches the ceiling, not you.')
    expectMarkupWellFormed(answer)
  })

  it('answers only with silence, differently the first, second and third time', () => {
    const game = new Game([new Act3()])
    const tobin = new Tobin()
    const answers = [1, 2, 3, 4, 5].map(() => tobin.talkTo(game.state))
    expect(answers[0]).toContain(FIRST)
    expect(answers[1]).toContain(SECOND)
    expect(answers[2]).toContain(THIRD)
    expect(answers[3]).toBe(answers[2])
    expect(answers[4]).toBe(answers[2])
    for (const answer of answers) {
      expect(answer.startsWith('[event]')).toBe(true)
      expect(answer).not.toContain('[dialogue]')
      expectMarkupWellFormed(answer)
    }
  })

  it('is unchanged by the Dragon’s Memory', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_DRAGONS_MEMORY_RECEIVED, true)
    expect(new Tobin().talkTo(game.state)).toContain(FIRST)
  })
})
